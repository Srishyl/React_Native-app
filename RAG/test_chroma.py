import chromadb
from chromadb.config import Settings
import os
import shutil

PERSIST_PATH = os.path.join(os.getcwd(), "chroma")

print(f"Testing ChromaDB connection at: {PERSIST_PATH}")

try:
    client = chromadb.PersistentClient(path=PERSIST_PATH, settings=Settings(anonymized_telemetry=False))
    print("Successfully connected to ChromaDB")
    print(f"Collections: {client.list_collections()}")
except Exception as e:
    print(f"Failed to connect: {e}")
    # import traceback
    # traceback.print_exc()

# Check if directory exists
if os.path.exists(PERSIST_PATH):
    print(f"Directory {PERSIST_PATH} exists.")
    print(f"Contents: {os.listdir(PERSIST_PATH)}")
else:
    print(f"Directory {PERSIST_PATH} does not exist.")
