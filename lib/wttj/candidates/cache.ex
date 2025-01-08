defmodule Wttj.Candidates.Cache do
  use GenServer

  @table_name :candidate_cache

  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(_) do
    :ets.new(@table_name, [:set, :named_table, :public])
    {:ok, %{}}
  end

  def get(key) do
    case :ets.lookup(@table_name, key) do
      [{^key, value, expiry}] ->
        if :os.system_time(:millisecond) < expiry do
          {:ok, value}
        else
          :ets.delete(@table_name, key)
          {:error, :expired}
        end
      [] ->
        {:error, :not_found}
    end
  end

  def put(key, value) do
    # Config is just put on test config only, set 10 minutes by default
    ttl = Application.get_env(:wttj, :cache_ttl, :timer.minutes(10))
    expiry = :os.system_time(:millisecond) + ttl
    :ets.insert(@table_name, {key, value, expiry})
  end

  def find_candidates_by_job_id(job_id) do
    prefix = "candidates:#{job_id}:"

    :ets.match(@table_name, {:"$1", :"$2", :"$3"})
    |> Enum.filter(fn [key, _, _] ->
      is_binary(key) and String.starts_with?(key, prefix)
    end)
  end

  def match_delete_by_job_id(job_id) do
    prefix = "candidates:#{job_id}:"

    matching_entries = :ets.match(@table_name, {:"$1", :"$2", :"$3"})
                       |> Enum.filter(fn [key, _, _] ->
      is_binary(key) and String.starts_with?(key, prefix)
    end)

    deleted_count = Enum.reduce(matching_entries, 0, fn [key, _, _], acc ->
      case :ets.delete(@table_name, key) do
        true -> acc + 1
        false -> acc
      end
    end)

    deleted_count
  end
end