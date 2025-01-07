defmodule Wttj.Candidates.UpdateService do
  @moduledoc """
    handle every candidate updates
    """

  alias Wttj.Candidates.{Candidate, RepositoryBehaviour, Repository, Lock }

  @type context :: %{
                          :repository => RepositoryBehaviour,
                        }

  @type update_props :: %{
    :status => String.t(),
    :position => float()
  }

  @doc """
  Updates a candidate's position and status.
  Using locking mechanism to prevent for multiple update and idempotency to avoid invoking db for nothing.

  ## Parameters
    * `job_id`- The candidate jobId
    * `candidate_id` - The candidate id to update
    * `props` - Map containing :status and :position updates
    * `client_updated_at` - last update_at on candidate on client side has
    * `context` - optional, used to mock repo implementation

  ## Returns
    * `{:ok, Candidate.t()}` - Successfully updated candidate
    * `{:error, :candidate_not_found}` - When candidate doesn't exist
    * `{:error, :stale_data}` - When candidate was updated concurrently
    * `{:error, :locked}` - When candidate is locked
    * `{:error, Ecto.Changeset.t()}` - When validation fails

  ## Examples
      iex> update_candidate("job123", "candidate456", %{status: "accepted", position: 1.0}, datetime, context)
      {:ok, %Candidate{}}

      iex> update_candidate("job123", "candidate456", %{status: "invalid", position: -1.0}, datetime, context)
      {:error, %Ecto.Changeset{}}
  """

  @spec update_candidate(String.t(), integer(), update_props(), Datetime, context()) ::
          {:ok, Candidate.t()} |
          {:error, :candidate_not_found} |
          {:error, :stale_data} |
          {:error, :locked} |
          {:error, Ecto.Changeset.t()}
  def update_candidate(job_id, candidate_id, props, client_updated_at, context \\ %{ repository: Repository }) do
    try do
      candidate = context.repository.get_by_id_and_job_id(candidate_id, job_id)

      {:ok, client_updated_at_date_time, 0}  =
        client_updated_at
        |> DateTime.from_iso8601()

      case DateTime.compare(client_updated_at_date_time, candidate.updated_at) do
        :lt -> { :error, :stale_data }
        _ -> if idempotency_check?(candidate, props) do
               {:ok, :not_updated, candidate}
             else
               case update_with_lock(candidate,props, context) do
                 { :ok, updated_candidate } -> {:ok, :updated, updated_candidate}
                 { :error, reason } -> { :error, reason }
                 end
          end
      end
    rescue
      Ecto.NoResultsError -> {:error, :candidate_not_found}
    end
  end

  defp idempotency_check?(candidate, props) do
    candidate.status == String.to_atom(props["status"]) && candidate.position == props["position"]
  end

  defp update_with_lock(candidate, props, context) do
    Lock.acquire(candidate.id, fn ->
      context.repository.update_position_and_status(candidate, props)
    end)
  end
end