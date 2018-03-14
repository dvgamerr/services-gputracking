@echo off
C: && cd C:\app\services-gputracking
GOTO START
:RESTART
ECHO RESTARTING...
:START
npm run dev
GOTO RESTART
