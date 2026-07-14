import { auth } from "@/auth";
import { getAllCollections, getCollection, putCollection } from "@/lib/gist";
import type { CollectionMap, CollectionName } from "@/lib/types";
import { NextResponse } from "next/server";

const VALID: CollectionName[] = [
  "projetos",
  "oneones",
  "feedbacks",
  "pendencias",
  "meta",
];

function isCollection(value: string): value is CollectionName {
  return VALID.includes(value as CollectionName);
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ collection: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { collection } = await context.params;
  try {
    if (collection === "all") {
      const data = await getAllCollections(session.accessToken);
      return NextResponse.json(data);
    }
    if (!isCollection(collection)) {
      return NextResponse.json({ error: "Collection inválida" }, { status: 400 });
    }
    const data = await getCollection(session.accessToken, collection);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao ler Gist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ collection: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { collection } = await context.params;
  if (!isCollection(collection)) {
    return NextResponse.json({ error: "Collection inválida" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as CollectionMap[typeof collection];
    const saved = await putCollection(session.accessToken, collection, body);
    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gravar Gist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
