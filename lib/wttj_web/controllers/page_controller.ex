defmodule WttjWeb.PageController do
  use WttjWeb, :controller

#  def index(conn, _params) do
#    conn
#  |> send_resp(200, render_react_app())
#  end

  def index(conn, _params) do
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, Path.join(:code.priv_dir(:wttj), "static/front/index.html"))
  end

  # Serve the index.html file as-is and let React
  # take care of the rendering and client-side routing.
  #
  # Potential improvement: Cache the file contents here
  # in an ETS table so we don't read from the disk for every request.
  defp render_react_app() do
    Application.app_dir(:wttj, "priv/static/front/index.html")
    |> File.read!()
  end
end
