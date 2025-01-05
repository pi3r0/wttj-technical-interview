defmodule Wttj.Repo.Migrations.PatchCandidatesPosition do
  use Ecto.Migration

  def up do
    # First drop the existing unique index
    drop_if_exists unique_index(:candidates, [:job_id, :position, :status])

    # Rename the existing integer column
    rename table(:candidates), :position, to: :old_position

    alter table(:candidates) do
      add :position, :float
    end

    # update the position with new value
    # step is 1000, 0 will be 1000 in order to give space
    execute """
    UPDATE candidates
    SET position = old_position * 1000.0 + 1000.0
    """

    alter table(:candidates) do
      remove :old_position
      modify :position, :float, null: false
    end

    create unique_index(:candidates, [:job_id, :position, :status])
  end

  def down do
    drop_if_exists unique_index(:candidates, [:job_id, :position, :status])

    rename table(:candidates), :position, to: :old_position

    alter table(:candidates) do
      add :position, :integer
    end

    execute """
    UPDATE candidates
    SET position = ROUND((old_position - 1000.0) / 1000.0)
    """

    alter table(:candidates) do
      remove :old_position
      modify :position, :integer, null: false
    end

    create unique_index(:candidates, [:job_id, :position, :status,])

  end
end
