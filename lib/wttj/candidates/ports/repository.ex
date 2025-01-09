defmodule Wttj.Candidates.RepositoryBehaviour do
  alias Wttj.Candidates.Candidate

  @type create_props :: %{
                          :email => String.t(),
                          :status => String.t(),
                          :position => float()
                        }

  @type update_props :: %{
    :status => String.t(),
    :position => float()
  }

  @type query_options :: %{
    optional(:cursor) => float() | nil,
    optional(:limit) => non_neg_integer() | 10
  }

  @type query_result :: %{
    :candidates => [Candidate.t()],
    :has_more => boolean()
  }

  @type column_result :: %{
    :id => String.t(),
     :candidate_count => integer
  }

  @callback create_candidate(String.t(), create_props()) :: Candidate.t()
  @callback get_columns_by_job_id(String.t()) :: [column_result]
  @callback get_paginated_by_job_id(String.t(), String.t(), query_options()) :: query_result
  @callback get_by_id_and_job_id(String.t(), String.t()) :: Candidate.t()
  @callback get_by_email_and_job_id(String.t(), String.t()) :: Candidate.t()
  @callback update_position_and_status(Candidate.t(), update_props()) :: Candidate.t()
end