#!/bin/bash
pkill -f "python3 -m http.server 3000"
cd /root/Escrew-Telegram-MVP/frontend && yarn build
cd /root/Escrew-Telegram-MVP/frontend/build && python3 -m http.server 3000 --bind 0.0.0.0 &
echo "Frontend rebuilt and restarted on port 3000"

