import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { saveProjectRoomsSchema } from "@/lib/validations/room.schema";
import { saveProjectRooms } from "@/server/services/analysis-service";
import type { SaveProjectRoomsResponse } from "@/types/room";

type SaveRoomsRouteResult =
  | Awaited<ReturnType<typeof saveProjectRooms>>
  | {
      ok: false;
      reason: "server_error";
    };

type ProjectRoomsRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

const invalidInputResponse: SaveProjectRoomsResponse = {
  ok: false,
  error: {
    code: "invalid_input",
    message:
      "Enter room names, valid room types, and non-negative suggestion values.",
  },
};

export async function PUT(
  request: Request,
  context: ProjectRoomsRouteContext,
) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = saveProjectRoomsSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const result: SaveRoomsRouteResult = await saveProjectRooms(
    parsedParams.data.projectId,
    auth.user.id,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Room save failed", error);

    return {
      ok: false,
      reason: "server_error",
    };
  });

  if (!result.ok) {
    const response: SaveProjectRoomsResponse = {
      ok: false,
      error: {
        code: result.reason,
        message:
          result.reason === "not_found"
            ? "Project not found."
            : result.reason === "invalid_room_reference"
              ? "One or more rooms do not belong to this project."
              : "Unable to save rooms.",
      },
    };

    return NextResponse.json(response, {
      status:
        result.reason === "not_found"
          ? 404
          : result.reason === "server_error"
            ? 500
            : 400,
    });
  }

  const response: SaveProjectRoomsResponse = {
    ok: true,
    rooms: result.rooms,
  };

  return NextResponse.json(response);
}
