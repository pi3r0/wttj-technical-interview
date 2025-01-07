defmodule Wttj.Candidates.Lock do
  @moduledoc """
  Handles distributed locks for concurrent operations
  """

  @lock_timeout 5000

  @spec acquire(String.t(), function) :: :done | {:error, :locked}
  def acquire(candidate_id, fun) do
    lock_key = "candidate:#{candidate_id}"
    case :global.set_lock({lock_key, node()}, [node()], @lock_timeout) do
      true ->
        try do
          fun.()
        after
          :global.del_lock({lock_key, node()}, [node()])
        end
      false ->
        {:error, :locked}
    end
  end
end