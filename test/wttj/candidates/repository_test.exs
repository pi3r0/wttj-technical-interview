defmodule Wttj.Candidates.RepositoryTest do
  alias Wttj.Candidates.{Repository}

  test "process_candidate/3 with valid ids" do
    assert {:ok, %Candidate{}} =
             CandidateService.process_candidate("valid_id", "valid_job_id", MockCandidateRepository)
  end
end