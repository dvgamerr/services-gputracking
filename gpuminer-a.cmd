@echo off
SET MINER=GPUMinerA
:LOOP
cls
TITLE %MINER%
node app.js %MINER%
node checkpoint.js %MINER%
GOTO LOOP