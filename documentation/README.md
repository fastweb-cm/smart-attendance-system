# Smart Attendance System

## Terminal Provisioning & Activation

The General assumption for this is that the terminal pcs and the central pc must be in the same network and the central is configured with a static IP addr.

### Step 1: Create Terminal in Central System

Create terminal in central admin panel, provide the terminal name, activation code (hashed and stored in db), etc

### Step 2: Install Terminal Application (Manual Setup)

On each terminal PC:

- Install the required runtime.
- Install the terminal application.
- Start the terminal app.

When launched for the first time, it should display:

- Termninal Not Registered
- Enter Activation Code

### Step 3: Terminal Activation

On the terminal PC:

1. Enter the Activation Code.
2. Terminal sends request to central API.

### Step 4: Central Server Validation

Central server verifies:

- Activation code.
- Status Pending.
  If Valid central then updates terminal status to active and returns the terminal response.
  An object which creates the terminal config file and saves the response object.

### Step 5: Terminal Bootstraps itself

After successful activation, terminal:

1. Creates local(cached) DB.
2. Pulls initial data.
   - Users
   - Biometric templates
   - etc
3. Switches UI to operational mode.

# Face Recognition System Process

## 1. Introduction

This system implements a face recognition pipeline for user enrollment and verification using deep learning (ArcFace) and similarity search (FAISS).

## 2. System Startup

When the application starts, the system initializes essential components.

### 2.1 Load Stored Face Data

- All stored biometric profiles are fetched from the database.
- Each stored face (BLOB) is converted back into a NumPy array.
- Embeddings are normalized.
- All embeddings are loaded into an in-memory FAISS index.
- A parallel list of user_ids is maintained for mapping.

### 2.2 Load Face Recognition Model

- The ArcFace model is loaded using DeepFace.
- This ensures fast embedding extraction during runtime.

## 3. Face Enrollment Process (/enroll-face)

This process registers a user's face into the system.

### 3.1 Input Validation

The system expects:

- A user_id
- At least 3 face images
  _If fewer than 3 images are provided, the request is rejected._

### 3.2 Image Decoding

Each uploaded image is:

- Read as bytes
- Converted into a NumPy array
- Decoded into an image using OpenCV

### 3.3 Face Detection

Faces are detected using `DeepFace.extract_faces()`
Images without detectable faces are skipped.

### 3.4 Face Cropping and Resizing

The first detected face is extracted.
The face is resized to:

- **160 × 160 pixels**

### 3.5 Embedding Extraction

Each cropped face is passed into:
`DeepFace.represent()`
the system uses the ArcFace model.
the output is a **512-dimensional embedding vector**.

### 3.6 Embedding Normalization

Each embedding is normalized using L2 normalization:
This ensures consistency for similarity comparison.

### 3.7 Embedding Aggregation

Multiple embeddings are combined by computing the average:
def final_embedding = mean(embeddings)
the averaged embedding is normalized again.

### 3.8 Convert Embedding to Binary

The final embedding is converted into a binary format (BLOB).
this allows storage in the database.

### 3.9 Store in Database

the system checks if the user exists:
f not: A new biometric profile is created; otherwise, the existing profile is updated with the new embedding.

### 3.10 Update FAISS Index

the new embedding is:
normalized,
and added to the FAISS index,
the corresponding user_id is stored in memory.

## 4. Face Verification Process (/verify)

This process verifies whether a face matches a registered user.

### 4.1 Input

the system receives:
a user_id and a single image.
decoding steps similar to enrollment apply here as well, including reading bytes, converting to NumPy array, and decoding with OpenCV.
'these steps include:
detecting faces, cropping, resizing to **160 × 160 pixels**, extracting embeddings, normalizing them, and performing similarity search against stored embeddings using FAISS.'

# FAISS in Your Face Recognition System

## 1. Introduction

FAISS (Facebook AI Similarity Search) is a library designed for fast similarity search in high-dimensional vector spaces.

In your face recognition system, FAISS is used to:

- Store face embeddings (vectors)
- Quickly find the most similar face to a query
- Replace slow brute-force comparisons

## 2. Why FAISS is Used

Without FAISS, verification would require:

- Comparing a new face embedding with every stored embedding
- Computing similarity one-by-one

This results in:

- **O(N)**

Where:

- _N_ = number of stored users

As your system scales, this becomes slow.

## 3. Core Idea Behind FAISS

FAISS speeds up similarity search using:

- Vector indexing
- Optimized matrix operations
- Approximate or exact nearest neighbor search

In your system, you use:

- **Index Type:** `faiss.IndexFlatIP`

This means:

- Exact search
- Uses Inner Product (IP) → equivalent to Cosine Similarity when vectors are normalized

## 4. Cosine Similarity (Your Matching Logic)

after normalization, FAISS computes similarity using:

```plaintext
distance = A ⋅ B
defines the similarity where A and B are normalized embeddings.
```

where:

- _A_, _B_ = normalized embeddings.

### 4.1 Learning Block (Cosine Similarity)

_(Conceptually represents linear similarity scaling — cosine similarity behaves proportionally after normalization)_

## 5. How FAISS Works in Your System

### 5.1 Enrollment Phase

to add faces to the system:
embeddings are extracted from faces,
normalized,
and added to FAISS index:
fai ss_index.add(embeddings)

### 5.2 Verification Phase

to verify a face:
embedding is extracted from input image,
normalized,
and queried in FAISS:
distances, indices = faiss_index.search(query, k=1)
the best match and its similarity score are returned.

## 6. Performance Analysis### 6.1 Without FAISS (Brute Force)

each verification takes time proportional to the number of stored users:
time complexity = O(N)
e.g., for N=100: ~100ms; for N=1000: ~1s.

### 6.2 With FAISS

the optimized vector search reduces time complexity approximately to O(log N) or near constant.
e.g., assuming search takes about 0.01 ms per query.

# Attendance Flow at Each Terminal

## 1. Initialization

- When a terminal page loads, it first fetches the terminal configuration using `useTerminalConfig()`.
- The configuration includes:
  - `auth_capabilities` → types of authentication steps required (e.g., Face, Card, OTP).
  - `access_policy` → mapping of user groups to allowed authentication steps.
- The authentication steps are built dynamically via `buildAuthFlow(config?.auth_capabilities)`.
- The `useAuthFlow` hook initializes:
  - `currentStepIndex` → tracks which step the user is on.
  - `identifiedUser` → stores the user object after a successful verification.
  - `allowedSteps` → steps the user is allowed to complete based on their group.
  - `isComplete` → tracks whether the flow is fully completed.

## 2. Ready to Scan

- Initially, the terminal shows a “Ready to Scan” screen.
- The user taps **START ATTENDANCE**.
- `started` is set to true, which triggers rendering of the first authentication step.

## 3. Step Execution

- The current step (`currentStep`) is rendered using `AuthStepRenderer`.
- The step shows a verification UI for that authentication type.
- Steps are displayed in order, but conditional logic applies:
  - `shouldAllowStep(currentStep.type)` checks if the user’s group has permission for the step.
  - If a step is not allowed, it is automatically skipped.

## 4. User Verification

- When the user completes a step successfully (`onSuccess`):
  - A mock user object is created (currently `{id: <userId>, group_id: 2}`).
  - `setUser(userObject, config.access_policy)` stores the user and determines allowed steps.
  - `next()` is called to move to the next step in the flow.
- If verification fails (`onFailure`):
  - The terminal shows an error message (`setMessage(msg)`).
  - The user can retry the current step.

## 5. Automatic Step Skipping

- After the user is identified, the system automatically skips steps the user is not allowed to access.
- Logic:
  - `allowedSteps` is set based on the user's group.

The `useEffect` watching `currentStep` checks:

```jsx
if (allowedSteps !== null && !shouldAllowStep(currentStep.type)) next();
default`
to only show steps included in `allowedSteps`.

## 6. Step Indicators
At the top of the terminal screen:
a. Each step has a step indicator circle:
done with icons:
| ✅ | Completed |
| 🔵 | Current |
and pending steps:
to be filled later or as per design,
e.g.,⬜ Pending|
a progress bar visually connects these steps.

## 7. Flow Completion
- When the last allowed step is completed:
'the following occurs:'
isComplete' is set to true,
the terminal shows a success screen:
based on example text:
e.g., "Attendance recorded" and "Thank you for verifying!"
the **Done** button resets flow for next user.

## 8. Manual Controls
- Skip Step button → allows users to skip optional steps.
- Cancel & Return to Home → exits flow and resets terminal.

## 9. Dynamic Behavior Summary
| Trigger | Effect |
|---------|---------|
since this part contains summarized logic, it can be formatted as above.
```
