defmodule WttjWeb.CandidateJSON do
  alias Wttj.Candidates.Candidate

  @doc """
  Renders a list of candidates.
  """
  def index(%{candidates: candidates, has_more: has_more, columns: columns}) do
    %{
      data: %{
        candidates: for(candidate <- candidates, do: data(candidate)),
        columns: columns,
        has_more: has_more
      }
    }
  end

  def index(%{candidates: candidates, has_more: has_more}) do
    %{
      data: %{
        candidates: for(candidate <- candidates, do: data(candidate)),
        has_more: has_more
      }
    }
  end

  @doc """
  Renders a single candidate.
  """
  def show(%{candidate: candidate}) do
     %{data: data(candidate)}
  end

  defp data(%Candidate{} = candidate) do
    %{
      id: candidate.id,
      email: candidate.email,
      status: candidate.status,
      position: candidate.position,
      updated_at: candidate.updated_at
    }
  end
end
