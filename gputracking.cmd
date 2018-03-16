@echo off
git checkout .
git pull origin master
SET /A COUNT=1 >nul
C: && cd C:\app\services-gputracking
GOTO START
:RESTART
CLS
SET /A COUNT=%COUNT%+1 >nul
ECHO RESTARTING %COUNT% ...
:START
npm start
GOTO RESTART
