defmodule WttjWeb.JobUpdateBroadcast do

  @moduledoc """
  Handles broadcasting job updates to SSE clients
  """

  def subscribe(job_id) do
    Phoenix.PubSub.subscribe(
      Wttj.PubSub,
      "job:#{job_id}"
    )
  end

  def broadcast_update(job_id, event_type, payload) do
    Phoenix.PubSub.broadcast(
      Wttj.PubSub,
      "job:#{job_id}",
      {event_type, payload}
    )
  end
end