-- Hexes split into seven smaller cells, as "row,col"; plants in them use "row,col:0"–"row,col:6".
ALTER TABLE "Scene" ADD COLUMN IF NOT EXISTS "splitCells" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
