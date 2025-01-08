defmodule Wttj.Repo.Migrations.AddIndexToSupportSearchByEmail do
  use Ecto.Migration

  def change do
    create unique_index(:candidates, [:job_id, :email])
  end
end
