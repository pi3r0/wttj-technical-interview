defmodule WttjWeb.ServerSentEventController do
  use WttjWeb, :controller

  alias WttjWeb.JobUpdateBroadcast

  def stream(conn, %{"job_id" => job_id}) do
    # 1. Set up SSE-specific headers
    conn =
      conn
      |> put_resp_content_type("text/event-stream")
      |> put_resp_header("cache-control", "no-cache")
      |> put_resp_header("connection", "keep-alive")
      |> send_chunked(200) # Initiates chunked response

    # 2. Subscribe to the job's update topic
    JobUpdateBroadcast.subscribe(job_id)

    # 3. Keep connection alive and handle messages
    stream_updates(conn)
  end

  # Handle different types of updates
  defp stream_updates(conn) do
    receive do
      {:candidate_updated, data} ->
        case chunk(conn, build_sse_event("candidate_updated", data)) do
          {:ok, conn} ->
            # Continue listening for more updates
            stream_updates(conn)
          {:error, :closed} ->
            # Client disconnected
            conn
        end
    after
      # Optional heartbeat to keep connection alive
      30_000 ->
        case chunk(conn, ":keepalive\n\n") do
          {:ok, conn} -> stream_updates(conn)
          {:error, :closed} -> conn
        end
    end
  end

  # Helper to format SSE events
  defp build_sse_event(event_name, data) do
    """
    event: #{event_name}
    data: #{Jason.encode!(data)}

    """
  end
end