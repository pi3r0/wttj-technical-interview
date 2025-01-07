defmodule Wttj.Candidates.Repository do
  @behaviour Wttj.Candidates.RepositoryBehaviour


  alias Wttj.Candidates.Candidate
  alias Wttj.Repo

  @type update_props :: %{
                          :status => String.t(),
                          :position => float()
                        }

  @impl true
  @spec get_by_id_and_job_id(String.t(), String.t()) :: Candidate.t()
  def get_by_id_and_job_id(id, job_id) do
    Repo.get_by!(Candidate, id: id, job_id: job_id)
  end

  @impl true
  @spec update_position_and_status(Candidate.t(), update_props()) :: Candidate.t()
  def update_position_and_status(candidate, props) do
    candidate
    |> Candidate.changeset(props)
    |> Repo.update()
  end
end
