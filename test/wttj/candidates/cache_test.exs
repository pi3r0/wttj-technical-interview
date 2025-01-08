defmodule Wttj.CacheTest do
  use Wttj.DataCase
  alias Wttj.Candidates.Cache

#  setup do
#    start_supervised!(Cache)
#    :ok
#  end

  test "puts and gets a value" do
    Cache.put("test_key", "test_value")
    assert {:ok, "test_value"} == Cache.get("test_key")
  end

  test "returns error for non-existent key" do
    assert {:error, :not_found} == Cache.get("non_existent_key")
  end

  test "remove one job caches after update, only job2 left" do
    job_id_one = 1
    job_id_two = 2

    key_one = "candidates:#{job_id_one}:status1:::true"
    key_two = "candidates:#{job_id_one}:status1::50:true"
    key_three = "candidates:#{job_id_two}:status1:1.0:50:true"
    key_four = "candidates:#{job_id_one}:status2:1.0:50:true"
    Cache.put(key_one, "data1")
    Cache.put(key_two, "data2")
    Cache.put(key_three, "data3")
    Cache.put(key_four, "data4")

    Cache.match_delete_by_job_id(job_id_one)

    assert {:error, :not_found} == Cache.get(key_one)
    assert {:error, :not_found} == Cache.get(key_two)
    assert {:error, :not_found} == Cache.get(key_four)
    assert {:ok, "data3"} == Cache.get(key_three)
  end

  test "expires values after TTL" do
    Cache.put("expire_key", "expire_value")
    :timer.sleep(2_000) # Sleep for 6 seconds (assuming 1 seconds TTL)
    assert {:error, :expired } == Cache.get("expire_key")
  end
end