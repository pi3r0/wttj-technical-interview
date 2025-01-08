defmodule Wttj.Candidates.CreateServiceTest do
  use Wttj.DataCase

  import Mox
  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures

  alias Wttj.Candidates.CreateService

  # Setup Mox for Repository and Broadcast
  @context %{ repository: Wttj.Candidates.RepositoryMock }
  setup :verify_on_exit!

  setup do
    job = job_fixture()

    %{
      job: job,
      valid_props: %{ "email" => "test@job.com", "status" => "hired"}
    }
  end

  describe "create_candidate/2" do
    test "happy path: successfully create candidate", %{
      job: job,
      valid_props: valid_props
    } do
      expect(@context.repository, :get_by_email_and_job_id, fn email, job_id ->
        assert email == valid_props["email"]
        assert job_id == job.id
        nil
      end)

      first_candidate_status = candidate_fixture(%{job_id: job.id})

      created_candidate = %{ job_id: job.id, email: valid_props["email"], status: valid_props["status"] }

      expect(@context.repository, :create_candidate, fn _, _ ->
        {:ok, created_candidate}
      end)

      expect(@context.repository, :get_paginated_by_job_id, fn job_id, status, _ ->
        assert job_id == job.id
        assert status == valid_props["status"]
        %{candidates: [first_candidate_status], has_more: true}
      end)

      assert {:ok, ^created_candidate} =
               CreateService.create_candidate(job.id, valid_props, @context)
    end

  end

  test "when user already exists: return error already created", %{
    job: job,
    valid_props: valid_props
  } do
    candidate = candidate_fixture(%{job_id: job.id})
    expect(@context.repository, :get_by_email_and_job_id, fn email, job_id ->
      assert email == valid_props["email"]
      assert job_id == job.id
      candidate
    end)

    created_candidate = %{ job_id: job.id, email: valid_props["email"], status: valid_props["status"], position: valid_props["position"]}

    expect(@context.repository, :create_candidate, 0, fn _, _ ->
      {:ok, created_candidate}
    end)

    assert {:error, :candidate_already_exists} =
             CreateService.create_candidate(job.id, valid_props, @context)
  end
end