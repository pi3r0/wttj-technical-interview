defmodule Wttj.Candidates.Repository do
  @behaviour Wttj.Candidates.RepositoryBehaviour


  import Ecto.Query, warn: false
  alias Wttj.Candidates.Candidate
  alias Wttj.Repo

  @type query_options :: %{
    optional(:cursor) => float(),
    optional(:limit) => non_neg_integer()
  }

  @type query_result :: %{
    :candidates => [Candidate.t()],
    :has_more => boolean()
  }

  @type column_result :: %{
    :id => String.t(),
    :candidate_count => integer
  }

  @impl true
  @spec get_columns_by_job_id(String.t()) :: [column_result]
  def get_columns_by_job_id(job_id) do
    Candidate
    |> where([c], c.job_id == ^job_id)
    |> group_by([c], c.status)
    |> select([c], {c.status, count(c.id)})
    |> order_by([c], [asc: c.status])
    |> Repo.all()
    |> Map.new()
  end

  @impl true
  @spec get_paginated_by_job_id(String.t(), String.t(), query_options()) :: query_result
  def get_paginated_by_job_id(job_id, status \\ nil, opts \\ %{ :cursor => nil, :limit => 100 }) do
    safe_options = opts
      |> Enum.into(%{
        cursor: nil,
        limit: 100
    })
    base_query = from c in Candidate,
      where: c.job_id == ^job_id,
      order_by: [asc: c.position]

    query = if status, do: where(base_query, [c], c.status in ^String.split(status, ",")), else: base_query

    query = if safe_options.cursor,
               do: where(query, [c], c.position > ^safe_options.cursor),
               else: query

    candidates = query
                 |> limit(^(safe_options.limit + 1))
                 |> Repo.all()

    {result, has_more} = if length(candidates) > safe_options.limit do
      {Enum.take(candidates, safe_options.limit), true}
    else
      {candidates, false}
    end

    %{
      candidates: result,
      has_more: has_more
    }
  end

  @type update_props :: %{
    :status => String.t(),
    :position => float()
  }

  @type create_props :: %{
                          :email => String.t(),
                          :status => String.t(),
                          :position => float()
                        }

  @impl true
  @spec create_candidate(String.t(), create_props()) :: Candidate.t()
  def create_candidate(job_id, props) do
    attrs = props
    |> Map.put("job_id", job_id)
    |> Enum.map(fn {k, v} -> {to_string(k), v} end)
    |> Enum.into(%{})

    %Candidate{}
    |> Candidate.changeset(attrs)
    |> Repo.insert()
  end

  @impl true
  @spec get_by_id_and_job_id(integer, String.t()) :: Candidate.t()
  def get_by_id_and_job_id(id, job_id) do
    Repo.get_by!(Candidate, id: id, job_id: job_id)
  end

  # TODO: add migration with a new index
  @impl true
  @spec get_by_email_and_job_id(integer, String.t()) :: Candidate.t()
  def get_by_email_and_job_id(email, job_id) do
    Repo.get_by(Candidate, job_id: job_id, email: email)
  end

  @impl true
  @spec update_position_and_status(Candidate.t(), update_props()) :: Candidate.t()
  def update_position_and_status(candidate, props) do
    candidate
    |> Candidate.changeset(props)
    |> Repo.update()
  end
end
