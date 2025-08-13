import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from models.schemas import ChunkData

logger = logging.getLogger(__name__)

class MarkdownChunker:
    def __init__(self):
        self.heading_pattern = re.compile(r"^#+\s*\d+(?:\.\d+)*\b")
        self.image_pattern = re.compile(r"!\[.*?\]\((.*?)\)")
        self.table_pattern = re.compile(r"(<table>.*?</table>)", re.DOTALL | re.IGNORECASE)
    
    def chunk_markdown_with_headings(self, md_path: str) -> List[ChunkData]:
        """
        Chunk markdown content based on headings with exact implementation
        """
        logger.info(f"Processing markdown file: {md_path}")
        
        if not Path(md_path).exists():
            logger.error(f"Markdown file not found: {md_path}")
            return []
        
        chunks = []
        heading = None
        content_lines = []
        images = []
        tables = []
        
        try:
            with open(md_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            for line in lines:
                stripped = line.strip()
                
                # Detect heading
                if stripped.startswith("#") and self.heading_pattern.match(stripped):
                    # Save previous chunk if exists
                    if heading is not None:
                        chunk_text = "".join(content_lines).strip()
                        if chunk_text or images or tables:
                            chunks.append(ChunkData(
                                heading=heading.strip(),
                                text=chunk_text,
                                images=images.copy(),
                                tables=tables.copy()
                            ))
                    
                    # Start new chunk
                    heading = line.strip()
                    content_lines.clear()
                    images.clear()
                    tables.clear()
                    continue
                
                # Extract images
                img_matches = self.image_pattern.findall(line)
                if img_matches:
                    images.extend(img_matches)
                
                # Extract tables
                table_matches = self.table_pattern.findall(line)
                if table_matches:
                    tables.extend(table_matches)
                
                # Add to content
                if heading is not None:
                    content_lines.append(line)
            
            # Save final chunk
            if heading is not None:
                chunk_text = "".join(content_lines).strip()
                if chunk_text or images or tables:
                    chunks.append(ChunkData(
                        heading=heading.strip(),
                        text=chunk_text,
                        images=images.copy(),
                        tables=tables.copy()
                    ))
            
            logger.info(f"Created {len(chunks)} chunks from {md_path}")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking markdown file {md_path}: {str(e)}")
            return []
    
    def process_directory(self, output_dir: str) -> List[ChunkData]:
        """
        Process all markdown files in output directory
        """
        logger.info(f"Processing directory: {output_dir}")
        all_chunks = []
        
        md_files = list(Path(output_dir).glob("**/*.md"))
        logger.info(f"Found {len(md_files)} markdown files")
        
        for md_file in md_files:
            chunks = self.chunk_markdown_with_headings(str(md_file))
            all_chunks.extend(chunks)
        
        logger.info(f"Total chunks processed: {len(all_chunks)}")
        return all_chunks