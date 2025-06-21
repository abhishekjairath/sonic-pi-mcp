# Universal Sonic Pi Song Queue System - Proper Loop Stopping
# Works with ANY Sonic Pi code - no modifications needed!

# Global state
set :current_song_id, 0
set :master_volume, 1.0
set :is_transitioning, false

# Main OSC listener
live_loop :song_queue do
  use_real_time
  
  song_data = sync "/osc*/run-code"
  new_song_code = song_data[0].to_s
  
  # Simple debounce
  if get[:is_transitioning]
    puts "Busy - skipping new song"
    next
  end
  
  set :is_transitioning, true
  old_song_id = get[:current_song_id]
  new_song_id = old_song_id + 1
  set :current_song_id, new_song_id
  
  puts "Starting song #{new_song_id}"
  
  in_thread do
    # Fade out current song if exists
    if old_song_id > 0
      puts "Fading out song #{old_song_id}"
      20.times do |i|
        vol = 1.0 - (i / 19.0)
        set :master_volume, vol
        sleep 0.1
      end
      
      # Signal old song to stop
      cue "stop_song_#{old_song_id}"
      sleep 1.0  # Give time for loops to stop cleanly
    end
    
    # Set volume to 0 for new song
    set :master_volume, 0.0
    
    # Start new song
    begin
      # Modify the code to add song-specific loop names and stop conditions
      modified_code = new_song_code.gsub(/live_loop\s+:(\w+)\s+do/) do |match|
        loop_name = $1
        "live_loop :song_#{new_song_id}_#{loop_name} do
  stop if get[:current_song_id] != #{new_song_id}"
      end
      
      # Replace amp parameters to use master volume
      volume_controlled_code = modified_code.gsub(/amp:\s*([0-9.]+)/) do |match|
        original_amp = $1
        "amp: #{original_amp} * get[:master_volume]"
      end
      
      eval(volume_controlled_code)
      
      puts "Song #{new_song_id} started"
      
      # Fade in new song
      sleep 0.3
      20.times do |i|
        vol = i / 19.0
        set :master_volume, vol
        sleep 0.1
      end
      
      puts "Song #{new_song_id} active"
      
    rescue Exception => e
      puts "Song error: #{e.message}"
      puts e.backtrace[0..2].join("\n")
    end
    
    set :is_transitioning, false
  end
end

# Status monitor
live_loop :status do
  puts "Queue: Song #{get[:current_song_id]} | Volume: #{get[:master_volume].round(2)} | Busy: #{get[:is_transitioning]}"
  sleep 8
end

puts "🎵 Improved Queue Ready - Send code to /run-code"
  