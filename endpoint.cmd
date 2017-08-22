@echo off
:LOOP
cls
TITLE GPUMinerA
node app.js GPUMinerA
node checkpoint.js
GOTO LOOP