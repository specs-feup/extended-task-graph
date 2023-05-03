@echo off
pushd .
cd src
cmd.exe /c clava ../test/TestScenarioA.js -pi -par -std c11 -cr -cl -cs -s -cfs -p ../test/inputs/scenarioA -b 0 -of ../test/output_code
popd
