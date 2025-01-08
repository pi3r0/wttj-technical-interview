defmodule Wttj.Repo.Migrations.CreateOptimiseSortingOnCandidatesPosition do
  use Ecto.Migration

  def change do
    drop_if_exists unique_index(:candidates, [:job_id, :position, :status])
    create unique_index(:candidates, [:job_id, :status, :position])
  end
end
