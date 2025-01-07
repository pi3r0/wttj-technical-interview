defmodule Wttj.Candidates.UpdateServiceTest do
  use Wttj.DataCase

  import Mox
  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures

  alias Wttj.Candidates.UpdateService

  # Setup Mox for Repository and Broadcast
  @context %{ repository: Wttj.Candidates.RepositoryMock }
  setup :verify_on_exit!

  setup do
    job = job_fixture()
    candidate = candidate_fixture(%{job_id: job.id})
    client_updated_at = DateTime.to_iso8601(candidate.updated_at)

    %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at,
      valid_props: %{ "status" => "hired", "position" => 1.0}
    }
  end

  describe "update_candidate/5" do
    test "happy path: successfully updates candidate", %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at,
      valid_props: valid_props
    } do
      expect(@context.repository, :get_by_id_and_job_id, fn id, job_id ->
        assert id == candidate.id
        assert job_id == job.id
        candidate
      end)

      updated_candidate = %{candidate | status: "hired", position: 1.0}

      expect(@context.repository, :update_position_and_status, fn ^candidate, ^valid_props ->
        {:ok, updated_candidate}
      end)

      assert {:ok, :updated, ^updated_candidate} =
               UpdateService.update_candidate(job.id, candidate.id, valid_props, client_updated_at, @context)
    end

    test "idempotency: returns existing candidate without update if already in desired state", %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at
    } do
      # Create props matching current candidate state
      props = %{ "status" => Atom.to_string(candidate.status), "position" => candidate.position }

      expect(@context.repository, :get_by_id_and_job_id, fn id, job_id ->
        assert id == candidate.id
        assert job_id == job.id
        candidate
      end)

      expect(@context.repository, :update_position_and_status, 0, fn _, _ -> {:ok, candidate } end)

      assert {:ok, :not_updated, ^candidate} =
               UpdateService.update_candidate(job.id, candidate.id, props, client_updated_at, @context)
    end

    test "returns error when candidate doesn't exist", %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at,
      valid_props: valid_props
    } do
      expect(@context.repository, :get_by_id_and_job_id, fn _, _ ->
        raise Ecto.NoResultsError, queryable: "candidates"
      end)

      assert {:error, :candidate_not_found} =
               UpdateService.update_candidate(job.id, candidate.id, valid_props, client_updated_at, @context)
    end

    test "returns error when candidate is locked", %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at,
      valid_props: valid_props
    } do
      expect(@context.repository, :get_by_id_and_job_id, fn _, _ -> candidate end)

      expect(@context.repository, :update_position_and_status, fn _, _ ->
        {:error, :locked}
      end)

      assert {:error, :locked} =
               UpdateService.update_candidate(job.id, candidate.id, valid_props, client_updated_at, @context)
    end

    test "returns error with invalid changeset", %{
      job: job,
      candidate: candidate,
      client_updated_at: client_updated_at
    } do
      invalid_props = %{"status" => "invalid_status", "position" => -1.0}
      changeset_error = %Ecto.Changeset{valid?: false, errors: [status: {"is invalid", []}]}

      expect(@context.repository, :get_by_id_and_job_id, fn _, _ -> candidate end)

      expect(@context.repository, :update_position_and_status, fn _, _ ->
        {:error, changeset_error}
      end)

      assert {:error, ^changeset_error} =
               UpdateService.update_candidate(job.id, candidate.id, invalid_props, client_updated_at, @context)
    end

    test "returns stale_data error when client_updated_at is older than candidate", %{
      job: job,
      candidate: candidate,
      valid_props: valid_props
    } do
      old_updated_at =
        DateTime.add(candidate.updated_at, -1000)
        |> DateTime.to_iso8601()

      expect(@context.repository, :get_by_id_and_job_id, fn _, _ -> candidate end)

      assert {:error, :stale_data} =
               UpdateService.update_candidate(job.id, candidate.id, valid_props, old_updated_at, @context)
    end
  end
end