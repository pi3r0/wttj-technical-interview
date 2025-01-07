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
    |> validate_inclusion(:status, @valid_statuses)  # Add other valid statuses as needed
  end

  # User embedded changeset
  defp user_changeset(struct, params) do
    struct
    |> cast(params, [:name, :color])
    |> validate_required([:name, :color])
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/)
  end
end

defmodule WttjWeb.CandidateController do
  use WttjWeb, :controller

  alias Wttj.Candidates
  alias Wttj.Candidates.UpdateService
  alias WttjWeb.JobUpdateBroadcast

  action_fallback WttjWeb.FallbackController

  def index(conn, %{"job_id" => job_id}) do
    candidates = Candidates.list_candidates(job_id)
    render(conn, :index, candidates: candidates)
  end

  def show(conn, %{"job_id" => job_id, "id" => id}) do
    candidate = Candidates.get_candidate!(job_id, id)
    render(conn, :show, candidate: candidate)
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
            conn
            |> put_status(:ok)
            |> render(:show, candidate: candidate)
            |> tap(fn _ ->
              JobUpdateBroadcast.broadcast_update(job_id, :candidate_updated, %{ candidate: candidate, user: user })
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
