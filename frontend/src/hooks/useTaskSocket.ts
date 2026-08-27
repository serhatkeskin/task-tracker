import { useEffect, useRef, useState } from "react";

import { api } from "../api/client";

const WS_BASE =
  import.meta.env.VITE_WS_URL !== undefined && import.meta.env.VITE_WS_URL !== ""
    ? import.meta.env.VITE_WS_URL
    : typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
      : "ws://localhost:8000";


export function useTaskSocket(
  workspaceId: number | null,
  onEvent: (type: string, payload: unknown) => void,
) {
  const [connected, setConnected] = useState(false);

  // Held in a ref so a changing callback identity does not tear down the socket.
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const token = api.getAccessToken();
    if (workspaceId === null || !token) return;

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;
    let attempt = 0;

    const connect = () => {
      socket = new WebSocket(`${WS_BASE}/ws/workspaces/${workspaceId}/?token=${token}`);

      socket.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data) as { type: string; payload: unknown };
          handlerRef.current(frame.type, frame.payload);
        } catch {
          // A frame we cannot parse is not worth tearing the socket down for.
        }
      };

      socket.onclose = (event) => {
        setConnected(false);
        // 4401 and 4403 are the server's auth and membership refusals.
        if (closedByUs || event.code === 4401 || event.code === 4403) return;
        attempt += 1;
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15000));
      };
    };

    connect();

    return () => {
      closedByUs = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [workspaceId]);

  return { connected };
}
