defmodule Wttj.Candidates.RepositoryTest do
  use Wttj.DataCase

  alias Wttj.Candidates.{Repository, Candidate}
  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures


  setup do
    job1 = job_fixture()
    {:ok, job1: job1}
  end

  describe "get_columns_by_job_id/1" do
    setup %{ job1: job1 } do
      candidate_new_second = candidate_fixture(%{job_id: job1.id, status: :new, position: 2000 })
      candidate_new_first = candidate_fixture(%{job_id: job1.id, status: :new, position: 1000 })
      candidate_new_third = candidate_fixture(%{job_id: job1.id, status: :new, position: 3000 })
      candidate_interview_first = candidate_fixture(%{job_id: job1.id, status: :interview, position: 200 })
      candidate_rejected_first = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 1000 })
      candidate_rejected_second = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 1500 })
      candidate_rejected_third = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 2000 })
      candidate_rejected_fourth = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 2500 })

      {
        :ok,
        new: [candidate_new_first, candidate_new_second, candidate_new_third],
        interview: [candidate_interview_first],
        hired: [],
        rejected: [candidate_rejected_first, candidate_rejected_second, candidate_rejected_third, candidate_rejected_fourth],
        rejected_half_position: candidate_rejected_second.position
      }
    end

    test "should return column with candidate and it count", %{job1: job1, new: new, interview: interview, rejected: rejected } do
      result = Repository.get_columns_by_job_id(job1.id)

      expectedResult = %{
        :interview => length(interview),
        :new => length(new),
        :rejected => length(rejected),
      }
      assert result == expectedResult


    end
  end

  describe "get_paginated_by_job_id/3 without candidate" do
    test "return empty result when job not exist" do
      result = Repository.get_paginated_by_job_id(1000)

      assert result == %{
        :candidates => [],
        :has_more => false
      }
    end

    test "return empty result when job exists but without candidate", %{job1: job1 } do
      result = Repository.get_paginated_by_job_id(job1.id)

      assert result == %{
               :candidates => [],
               :has_more => false
             }
    end
  end

  describe "get_paginated_by_job_id/3 with candidates" do
    setup %{ job1: job1 } do
      candidate_new_second = candidate_fixture(%{job_id: job1.id, status: :new, position: 2000 })
      candidate_new_first = candidate_fixture(%{job_id: job1.id, status: :new, position: 1000 })
      candidate_new_third = candidate_fixture(%{job_id: job1.id, status: :new, position: 3000 })
      candidate_interview_first = candidate_fixture(%{job_id: job1.id, status: :interview, position: 200 })
      candidate_rejected_first = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 1000 })
      candidate_rejected_second = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 1500 })
      candidate_rejected_third = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 2000 })
      candidate_rejected_fourth = candidate_fixture(%{job_id: job1.id, status: :rejected, position: 2500 })

      {
        :ok,
        new: [candidate_new_first, candidate_new_second, candidate_new_third],
        interview: [candidate_interview_first],
        hired: [],
        rejected: [candidate_rejected_first, candidate_rejected_second, candidate_rejected_third, candidate_rejected_fourth],
        rejected_half_position: candidate_rejected_second.position
      }
    end

    test "when no status, opts are provided it returns all result", %{job1: job1, new: new, interview: interview, hired: hired, rejected: rejected } do
      result = Repository.get_paginated_by_job_id(job1.id)

      expectedResult = List.flatten([hired, interview, new, rejected])
      assert length(result.candidates) == length(expectedResult)
      assert result == %{
               :candidates => expectedResult,
               :has_more => false
             }


    end

    test "When status is provided, return only the right candidates", %{job1: job1, rejected: rejected } do
      result = Repository.get_paginated_by_job_id(job1.id, "rejected")

      expectedResult = List.flatten([rejected])
      assert length(result.candidates) == length(expectedResult)
      assert result == %{
               :candidates => expectedResult,
               :has_more => false
             }


    end

    test "When status is provided and limit is set, return only the right candidates", %{job1: job1, rejected: rejected } do
      result = Repository.get_paginated_by_job_id(job1.id, "rejected", %{ limit: 2 })

      expectedResult = Enum.take(rejected, 2)
      assert length(result.candidates) == length(expectedResult)
      assert result == %{
               :candidates => expectedResult,
               :has_more => true
             }
    end

    test "When status is provided and cursor is set, return only the right candidates", %{job1: job1, rejected: rejected, rejected_half_position: rejected_half_position  } do
      result = Repository.get_paginated_by_job_id(job1.id, "rejected", %{ cursor: rejected_half_position })

      expectedResult = Enum.take(rejected, -2)
      assert length(result.candidates) == length(expectedResult)
      assert result == %{
               :candidates => expectedResult,
               :has_more => false
             }
    end

    test "When status is provided, limit is set and cursor is set, return only the right candidates", %{job1: job1, rejected: rejected, rejected_half_position: rejected_half_position  } do
      result = Repository.get_paginated_by_job_id(job1.id, "rejected", %{ cursor: rejected_half_position, limit: 1 })

      expectedResult = Enum.slice(rejected, 2, 1)
      assert length(result.candidates) == length(expectedResult)
      assert result == %{
               :candidates => expectedResult,
               :has_more => true
             }
    end
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