#!/usr/bin/env bash
set -e # fail the script if we get a non zero exit code

program_name=$1
region_name=$2

zowe cics refresh program "$program_name" --region-name "$region_name"
