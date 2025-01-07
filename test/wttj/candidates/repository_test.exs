defmodule Wttj.Candidates.RepositoryTest do
  use Wttj.DataCase

  alias Wttj.Candidates.{Repository, Candidate}
  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures


  setup do
    job1 = job_fixture()
    {:ok, job1: job1}
  end

  describe "get_by_id_and_job_id/2" do
    test "returns candidate when exists", %{job1: job1 } do
      # Setup: Create a candidate in the database
      candidate = candidate_fixture(%{job_id: job1.id})

      # Test successful retrieval
      assert %Candidate{} = Repository.get_by_id_and_job_id(candidate.id, candidate.job_id)
    end

    test "raises Ecto.NoResultsError when candidate doesn't exist", %{job1: job1 } do
      assert_raise Ecto.NoResultsError, fn ->
        Repository.get_by_id_and_job_id(1,job1.id )
      end
    end
  end

  describe "update_position_and_status/2" do
    test "updates candidate with valid props", %{job1: job1 } do
      candidate = candidate_fixture(%{job_id: job1.id})
      valid_props = %{status: "hired", position: 1.0}

      assert {:ok, updated_candidate} = Repository.update_position_and_status(candidate, valid_props)
      assert updated_candidate.status == :hired
      assert updated_candidate.position == 1.0
    end

    test "returns error changeset with invalid status", %{job1: job1 } do
      candidate = candidate_fixture(%{job_id: job1.id})
      invalid_props = %{status: "invalid_status", position: 1.0}

      assert {:error, changeset} = Repository.update_position_and_status(candidate, invalid_props)
      assert "is invalid" in errors_on(changeset).status
    end

    test "returns error changeset with invalid position", %{job1: job1 } do
      candidate = candidate_fixture(%{job_id: job1.id})
      invalid_props = %{status: "accepted", position: -1.0}

      assert {:error, changeset} = Repository.update_position_and_status(candidate, invalid_props)
      assert "must be greater than 0" in errors_on(changeset).position
    end

    test "returns error changeset with missing required fields", %{job1: job1 } do
      candidate = candidate_fixture(%{job_id: job1.id})
      empty_props = %{status: nil, position: nil}

      assert {:error, changeset} = Repository.update_position_and_status(candidate, empty_props)
      assert "can't be blank" in errors_on(changeset).status
      assert "can't be blank" in errors_on(changeset).position
    end
  end
end