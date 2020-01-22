--[[
  Adds a job to the queue by doing the following:
    - Increases the job counter if needed.
    - Creates a new job key with the job data.

    - if delayed:
      - computes timestamp.
      - adds to delayed zset.
      - Emits a global event 'delayed' if the job is delayed.
    - if not delayed
      - Adds the jobId to the wait/paused list in one of three ways:
         - LIFO
         - FIFO
         - prioritized.
      - Adds the job to the "added" list so that workers gets notified.

    Input:
      KEYS[1] 'wait',
      KEYS[2] 'paused'
      KEYS[3] 'meta-paused'
      KEYS[4] 'id'
      KEYS[5] 'delayed'
      KEYS[6] 'priority'

      ARGV[1]  key prefix,
      ARGV[2]  custom id (will not generate one automatically)
      ARGV[3]  name
      ARGV[4]  data (json stringified job data)
      ARGV[5]  opts (json stringified job opts)
      ARGV[6]  timestamp
      ARGV[7]  delay
      ARGV[8]  delayedTimestamp
      ARGV[9]  priority
      ARGV[10] LIFO
      ARGV[11] token
]]

print 'LUA SCRIPT: inside the script'
print('LUA SCRIPT: redis', dump(redis))
print('LUA SCRIPT: bit', dump(bit))

local jobId
local jobIdKey
local rcall = redis.call
print('LUA SCRIPT:  calling "INCR"')
local jobCounter = rcall("INCR", KEYS[4])
jobCounter = math.floor(jobCounter)
print('LUA SCRIPT: jobCounter is', jobCounter);
if ARGV[2] == "" then
  jobId = jobCounter
  jobIdKey = ARGV[1] .. jobId
else
  jobId = ARGV[2]
  jobIdKey = ARGV[1] .. jobId
  print("Searching for", jobIdKey)
  if rcall("EXISTS", jobIdKey) == 1 then
    print ("Returning jobId", jobId)
    return jobId .. "" -- convert to string
  end
end

-- Store the job.
rcall("HMSET", jobIdKey, "name", ARGV[3], "data", ARGV[4], "opts", ARGV[5], "timestamp", ARGV[6], "delay", ARGV[7], "priority", ARGV[9])

-- Check if job is delayed
local delayedTimestamp = tonumber(ARGV[8])
print("delayedTimestamp is", delayedTimestamp)
if(delayedTimestamp ~= 0) then
  print("getting bit.band for ", jobCounter, 0xfff)
  local timestamp = delayedTimestamp * 0x1000 + bit.band(jobCounter, 0xfff)
  rcall("ZADD", KEYS[5], timestamp, jobId)
  rcall("PUBLISH", KEYS[5], delayedTimestamp)
else
  local target
  print("Check for ", KEYS[3])
  -- Whe check for the meta-paused key to decide if we are paused or not
  -- (since an empty list and !EXISTS are not really the same)
  local paused
  if rcall("EXISTS", KEYS[3]) ~= 1 then
    target = KEYS[1]
    paused = false
  else
    target = KEYS[2]
    paused = true
  end
  print("paused is ", paused)
  -- Standard or priority add
  local priority = tonumber(ARGV[9])
  if priority == 0 then
      -- LIFO or FIFO
    rcall(ARGV[10], target, jobId)

    -- Emit waiting event (wait..ing@token)
    rcall("PUBLISH", KEYS[1] .. "ing@" .. ARGV[11], jobId)
  else
    -- Priority add
    rcall("ZADD", KEYS[6], priority, jobId)
    local count = rcall("ZCOUNT", KEYS[6], 0, priority)

    local len = rcall("LLEN", target)
    local id = rcall("LINDEX", target, len - (count-1))
    if id then
      rcall("LINSERT", target, "BEFORE", id, jobId)
    else
      rcall("RPUSH", target, jobId)
    end

  end
end

return jobId .. "" -- convert to string
