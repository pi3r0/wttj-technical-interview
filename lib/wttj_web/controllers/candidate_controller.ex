defmodule Wttj.Validators.CandidateUpdate do
  use Ecto.Schema
  import Ecto.Changeset

  @valid_statuses ["new", "interview", "hired", "rejected"]
  # Embedded schemas
  embedded_schema do
    field :current_candidate_updated_at, :utc_datetime
    embeds_one :candidate, Candidate do
      field :position, :float
      field :status, :string
    end
    embeds_one :user, User do
      field :name, :string
      field :color, :string
    end
  end

  # Main changeset function
  def changeset(struct \\ %__MODULE__{}, params) do
    struct
    |> cast(params, [:current_candidate_updated_at])
    |> cast_embed(:candidate, required: true, with: &candidate_changeset/2)
    |> cast_embed(:user, required: true, with: &user_changeset/2)
    |> validate_required([:current_candidate_updated_at])
  end

  # Candidate embedded changeset
  defp candidate_changeset(struct, params) do
    struct
    |> cast(params, [:position, :status])
    |> validate_required([:position, :status])
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> validate_inclusion(:status, @valid_statuses)
  end

  defp user_changeset(struct, params) do
    struct
    |> cast(params, [:name, :color])
    |> validate_required([:name, :color])
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/)
  end
end

defmodule Wttj.Validators.CandidateCreate do
    use Ecto.Schema
    import Ecto.Changeset

    @valid_statuses ["new", "interview", "hired", "rejected"]
    # Embedded schemas
    embedded_schema do
      field :email, :string
      field :status, :string
    end

    def changeset(struct \\ %__MODULE__{}, params) do
      struct
      |> cast(params, [:status, :email])
      |> validate_required([:status, :email])
      |> validate_inclusion(:status, @valid_statuses)
      |> validate_format(:email, ~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    end
end

defmodule WttjWeb.CandidateController do
  use WttjWeb, :controller

  alias Wttj.Candidates
  alias Wttj.Candidates.Repository
  alias Wttj.Candidates.UpdateService
  alias Wttj.Candidates.CreateService
  alias WttjWeb.JobUpdateBroadcast
  alias Wttj.Candidates.Cache

  action_fallback WttjWeb.FallbackController

  def index(conn, %{"job_id" => job_id} = params) do
    # should check the status to validated
    status = params["status"]
    cursor = case params["cursor"] do
      nil -> nil
      cursor_str ->
        case Float.parse(cursor_str) do
          {float_value, _} -> float_value
          :error -> nil
        end
    end

    limit = String.to_integer(params["limit"] || "1000")
    with_column = params["with_column"]

    cache_key = "candidates:#{job_id}:#{status}:#{cursor}:#{limit}:#{with_column}"

    case Cache.get(cache_key) do
      {:ok, cached_data} ->
        render(conn, :index, cached_data)
      _ ->
        %{candidates: candidates, has_more: has_more} =
          Repository.get_paginated_by_job_id(job_id, status, %{cursor: cursor, limit: limit})

        result = if with_column do
          columns = Repository.get_columns_by_job_id(job_id)
          %{candidates: candidates, has_more: has_more, columns: columns}
        else
          %{candidates: candidates, has_more: has_more}
        end

        Cache.put(cache_key, result)
        render(conn, :index, result)
    end
  end

  def show(conn, %{"job_id" => job_id, "id" => id}) do
    candidate = Candidates.get_candidate!(job_id, id)
    render(conn, :show, candidate: candidate)
  end

  def create(conn,  %{"job_id" => job_id, "props" => props, "user" => user}) do
    case Wttj.Validators.CandidateCreate.changeset(props) do
      %{valid?: true} ->
        case CreateService.create_candidate(job_id, props) do
          {:ok, candidate} ->

            # remove cache when update is done
            Cache.match_delete_by_job_id(job_id)

            conn
            |> put_status(:ok)
            |> render(:show, candidate: candidate)
            |> tap(fn _ ->
              columns = Repository.get_columns_by_job_id(job_id)
              JobUpdateBroadcast.broadcast_update(job_id, :candidate_updated, %{ candidate: candidate, user: user, columns: columns, kind: "add" })
            end)
          {:error, :candidate_already_exists} ->
            conn
            |> put_status(:conflict)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'409')
          {:error, _} ->
            conn
            |> put_status(:internal_error)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'500')
        end
      %{valid?: false} ->
        conn
        |> put_status(:bad_request)
        |> put_view(json: WttjWeb.ErrorJSON)
        |> render(:'400')
    end

  end

  def update(conn, %{"job_id" => job_id, "id" => id, "candidate" => candidate, "current_candidate_updated_at" => current_candidate_updated_at, "user" => user }) do
    validation_params = %{
      "candidate" => candidate,
      "user" => user,
      "current_candidate_updated_at" => current_candidate_updated_at
    }
    case Wttj.Validators.CandidateUpdate.changeset(validation_params) do
      %{valid?: true} ->
        case UpdateService.update_candidate(job_id, id, candidate, current_candidate_updated_at) do
          {:ok, :updated, candidate} ->

            # remove cache when update is done
            Cache.match_delete_by_job_id(job_id)

            conn
            |> put_status(:ok)
            |> render(:show, candidate: candidate)
            |> tap(fn _ ->
              columns = Repository.get_columns_by_job_id(job_id)
              JobUpdateBroadcast.broadcast_update(job_id, :candidate_updated, %{ candidate: candidate, user: user, columns: columns, kind: "updated" })
            end)

          {:ok, :not_updated, candidate} ->
            conn
            |> put_status(:ok)
            |> render(:show, candidate: candidate)

          {:error, :candidate_not_found} ->
            conn
            |> put_status(:not_found)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'404')

          {:error, :stale_data} ->
            conn
            |> put_status(:conflict)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'409')
          {:error, :locked} ->
            conn
            |> put_status(:conflict)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'409')
          {:error, _} ->
            conn
            |> put_status(:internal_error)
            |> put_view(json: WttjWeb.ErrorJSON)
            |> render(:'500')
        end
      %{valid?: false} ->
        conn
        |> put_status(:bad_request)
        |> put_view(json: WttjWeb.ErrorJSON)
        |> render(:'400')
    end
  end
end
