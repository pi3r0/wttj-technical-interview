defmodule Wttj.Candidates.RepositoryBehaviour do
  alias Wttj.Candidates.Candidate

  @type update_props :: %{
                          :status => String.t(),
                          :position => float()
                        }

  @callback get_by_id_and_job_id(String.t(), String.t()) :: Candidate.t()
  @callback update_position_and_status(Candidate.t(), update_props()) :: Candidate.t()
end