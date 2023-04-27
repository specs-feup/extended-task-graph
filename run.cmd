@echo off
pushd .
cd src
cmd.exe /c clava StandaloneMain.js -pi -par -std c11 -cr -cl -cs -s -cfs -p ../inputs/scenarioA -b 0 -of ../output_code
popd
