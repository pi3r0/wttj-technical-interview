defmodule Wttj.Candidates.Repository do
  @spec get_by_id_and_job_id(String.t(), String.t()) :: Candidate.t()
  def get_by_id_and_job_id(id, job_id) do
    Repo.get_by!(Candidate, id: id, job_id: job_id)
  end
end
