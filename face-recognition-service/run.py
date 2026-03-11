import uvicorn  # uvicorn is the web server that run FastAPI apps

# # Checks whether this file is been exec directly
# # If the file is been imported somewhere else, this file block will not tun
if __name__ == "__main__":
    uvicorn.run("app.main:app", reload=True)

# import base64

# with open("me2.jpeg", "rb") as f:
#     print(base64.b64encode(f.read()).decode())
