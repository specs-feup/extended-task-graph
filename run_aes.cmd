@echo off
pushd .
cd src
cmd.exe /c clava ../test/TestCHStone.js -pi -par -std c11 -cr -cl -cs -s -cfs -b 0 -of ../output_code -dep https://github.com/specs-feup/clava-benchmarks.git?folder=CHStone
popd
