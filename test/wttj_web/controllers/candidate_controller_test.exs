defmodule WttjWeb.CandidateControllerTest do
  use WttjWeb.ConnCase

  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures

  setup %{conn: conn} do
    job = job_fixture()
    {:ok, conn: put_req_header(conn, "accept", "application/json"), job: job}


  end

  describe "index" do
    test "lists all candidates", %{conn: conn, job: job} do
      conn = get(conn, ~p"/api/jobs/#{job}/candidates")
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "controller: update candidate/2" do
    setup do
      job = job_fixture()
      candidate = candidate_fixture(%{job_id: job.id})
      current_updated_at =
        candidate.updated_at
        |> DateTime.to_iso8601()

      # Subscribe to the job's channel to catch broadcasts
      Phoenix.PubSub.subscribe(Wttj.PubSub, "job:#{job.id}")

      %{
        job: job,
        candidate: candidate,
        current_updated_at: current_updated_at,
        valid_attrs: %{
          "status" => "hired",
          "position" => 1000.0
        },
        user: %{ name: "john-doe", color: "#111111"}
      }
    end

    test "renders candidate when data is valid", %{
      conn: conn,
      job: job,
      candidate: candidate,
      valid_attrs: valid_attrs,
      current_updated_at: current_updated_at,
      user: user
    } do


      conn = put(conn, ~p"/api/jobs/#{job}/candidates/#{candidate.id}", %{
        "candidate" => valid_attrs,
        "current_candidate_updated_at" => current_updated_at,
        "user" => user
      })
      # Test response
      result = %{
      "data" => %{
        "id" => candidate.id,
        "email" => candidate.email,
        "status" => "hired",
        "position" => 1000.0,
        "updated_at" => DateTime.to_iso8601(candidate.updated_at)
        }
      }

      assert result == json_response(conn, 200)

      updated_candidate = Wttj.Repo.get!(Wttj.Candidates.Candidate, candidate.id)
      assert updated_candidate.status == :hired
      assert updated_candidate.position == 1000.0

      # Test broadcast
      assert_receive {:candidate_updated, broadcast_candidate}
      assert broadcast_candidate.candidate.id == candidate.id
      assert broadcast_candidate.candidate.status == :hired
      assert broadcast_candidate.candidate.position == 1000.0
      assert broadcast_candidate.user["name"] == user.name
    end

    test "doesn't broadcast when no update needed", %{
      conn: conn,
      job: job,
      candidate: candidate,
      current_updated_at: current_updated_at,
      user: user
    } do
      # Use current values
      current_attrs = %{
        "status" => "new",
        "position" => candidate.position
      }

      conn = put(conn, ~p"/api/jobs/#{job.id}/candidates/#{candidate.id}", %{
        "candidate" => current_attrs,
        "current_candidate_updated_at" => current_updated_at,
        "user" => user
      })

      # Test response
      result = %{
        "data" => %{
          "id" => candidate.id,
          "email" => candidate.email,
          "status" => "new",
          "position" => candidate.position,
          "updated_at" => DateTime.to_iso8601(candidate.updated_at)
        }
      }

      assert result == json_response(conn, 200)

      # Verify data hasn't changed
      unchanged_candidate = Wttj.Repo.get!(Wttj.Candidates.Candidate, candidate.id)
      assert unchanged_candidate.status == candidate.status
      assert unchanged_candidate.position == candidate.position

      # Verify no broadcast was sent
      refute_receive {:candidate_updated, _}
    end
  end
end
