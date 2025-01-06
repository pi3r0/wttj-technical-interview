defmodule Wttj.Candidates.Candidate do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :email, :status, :position, :updated_at]}
  schema "candidates" do
    field :position, :float
    field :status, Ecto.Enum, values: [:new, :interview, :rejected, :hired], default: :new
    field :email, :string
    field :job_id, :id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [:email, :status, :position, :job_id])
    |> validate_required([:status, :position])  # This enforces non-empty fields
    |> validate_number(:position, greater_than: 0)  # This validates position > 0
    |> validate_inclusion(:status, [:new, :interview, :rejected, :hired])  # This validates status values
    |> validate_required([:email, :status, :position, :job_id])
  end
end
