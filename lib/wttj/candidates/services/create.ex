defmodule Wttj.Candidates.CreateService do
  @moduledoc """
  handle candidate creation
  """

  alias Wttj.Candidates.{Candidate, RepositoryBehaviour, Repository }

  @type context :: %{
                     :repository => RepositoryBehaviour,
                   }

  @type create_props :: %{
                          :email => String.t(),
                          :status => String.t(),
                          :position => float()
                        }

  @doc """
  Create a candidate based on props.
  Check if user already exist i.e. email already exists for this job

  ## Parameters
    * `job_id`- The candidate jobId
    * `props` - Map containing :status and :position updates
    * `context` - optional, used to mock repo implementation

  ## Returns
    * `{:ok, Candidate.t()}` - Successfully updated candidate
    * `{:error, :candidate_already_exists}` - When candidate already exists
    * `{:error, Ecto.Changeset.t()}` - When props not matching expectation
    * `{:error, Ecto.ConstraintError.t()}` - When props are in conflict with current candidate in DB based on unique index on model candidate

  ## Examples
      iex> create_candidate("job123", %{ email: "email@test.com", status: "accepted", position: 1.0}, datetime, context)
      {:ok, %Candidate{}}

      iex> create_candidate("job123", %{ email: "email@test.com", status: "invalid", position: -1.0}, datetime, context)
      {:error, :candidate_already_exists}
  """

  @spec create_candidate(String.t(), create_props(), context()) ::
          {:ok, Candidate.t()} |
          {:error, :candidate_already_exists} |
          {:error, Ecto.Changeset.t()} |
          {:error, Ecto.ConstraintError.t()}
  def create_candidate(job_id, props, context \\ %{ repository: Repository }) do
      case context.repository.get_by_email_and_job_id(props["email"], job_id) do
        nil ->
          new_position = compute_new_position(job_id, props["status"], context)
          updated_props = Map.put(props, "position", new_position)

          context.repository.create_candidate(job_id, updated_props)
        _ -> {:error, :candidate_already_exists }
      end
  end

  # It will compute the position to put the new candidate on the top
  # I want new candidate to be visible due to pagination issue
  # Better solution is to create a temp card on the front and let him drag into the right state
  defp compute_new_position(job_id, status, context) do
    case context.repository.get_paginated_by_job_id(job_id, status, %{limit: 1}) do
      %{candidates: [first_candidate | _], has_more: _} ->
        first_candidate.position / 2
      %{candidates: [], has_more: _} ->
        1000
      _ ->
        1000
    end
  end
end