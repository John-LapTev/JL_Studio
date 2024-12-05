@echo off
mkdir models\flux\loras 2>nul
mkdir output 2>nul
mkdir img2img 2>nul
mkdir logs 2>nul
mkdir docs\images 2>nul
mkdir docs\en 2>nul

type nul > models\flux\loras\.gitkeep
type nul > output\.gitkeep
type nul > img2img\.gitkeep
type nul > logs\.gitkeep
type nul > docs\images\.gitkeep