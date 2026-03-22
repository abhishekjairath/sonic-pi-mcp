# Sonic Pi MCP v2 — DJ session runner (queue + crossfade)
#
# Paste this entire buffer into Sonic Pi and press Run once. Leave it running.
# The MCP sends code to OSC path /run-code (default). Each new segment fades out
# the previous song id, then evals your new loops with prefixed names so old
# material can stop when superseded.
#
# Tips for code you send from the LLM:
# - Use named live_loops: :drums, :bass, :harmony, etc.
# - Optionally start with use_bpm N for tempo.
# - Use explicit amp: values where you care about levels (runner scales with master_volume).

set :current_song_id, 0
set :master_volume, 1.0
set :is_transitioning, false

live_loop :mcp_song_queue do
  use_real_time

  song_data = sync "/osc*/run-code"
  new_song_code = song_data[0].to_s

  if get[:is_transitioning]
    puts "MCP queue: busy — skipping overlapping request"
    next
  end

  set :is_transitioning, true
  old_song_id = get[:current_song_id]
  new_song_id = old_song_id + 1
  set :current_song_id, new_song_id

  puts "MCP queue: starting song #{new_song_id}"

  in_thread do
    if old_song_id > 0
      puts "MCP queue: fading out song #{old_song_id}"
      20.times do |i|
        vol = 1.0 - (i / 19.0)
        set :master_volume, vol
        sleep 0.1
      end
      sleep 1.0
    end

    set :master_volume, 0.0

    begin
      modified_code = new_song_code.gsub(/live_loop\s+:(\w+)\s+do/) do
        loop_name = $1
        "live_loop :song_#{new_song_id}_#{loop_name} do
  stop if get[:current_song_id] != #{new_song_id}"
      end

      volume_controlled_code = modified_code.gsub(/amp:\s*([0-9.]+)/) do
        original_amp = $1
        "amp: #{original_amp} * get[:master_volume]"
      end

      sync_fixed_code = volume_controlled_code.gsub(/sync\s+:(\w+)/) do
        original_loop_name = $1
        "sync :song_#{new_song_id}_#{original_loop_name}"
      end

      eval(sync_fixed_code)

      puts "MCP queue: song #{new_song_id} running"

      sleep 0.3
      20.times do |i|
        vol = i / 19.0
        set :master_volume, vol
        sleep 0.1
      end

      puts "MCP queue: song #{new_song_id} active (full level)"
    rescue Exception => e
      puts "MCP queue error: #{e.message}"
      puts e.backtrace[0..6].join("\n")
      if defined?(sync_fixed_code) && sync_fixed_code
        puts "---- code passed to eval (first 1500 chars; find line from error) ----"
        puts sync_fixed_code[0, 1500]
        puts "---- end snippet ----"
      end
      # eval runs after we zeroed volume for fade-in; if eval fails, fade-in never runs — un-mute or the next segment stays silent
      set :master_volume, 1.0
      puts "MCP queue: volume reset to 1.0 — fix the Ruby and send queue_segment again."
    end

    set :is_transitioning, false
  end
end

live_loop :mcp_status do
  puts "MCP v2 | song #{get[:current_song_id]} | vol #{get[:master_volume].round(2)} | busy #{get[:is_transitioning]}"
  sleep 12
end

puts "Sonic Pi MCP v2 — DJ runner ready. Send OSC to /run-code."
