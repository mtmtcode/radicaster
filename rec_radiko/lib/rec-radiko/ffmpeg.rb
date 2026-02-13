require "tempfile"

module Radicaster
  module RecRadiko
    class Ffmpeg
      def concat(m4a_paths)
        # NOTE:
        # ffmpegでファイルを連結するには元ファイルのリストを書いたテキストを
        # 入力ファイルとして食わせる必要がある
        # https://trac.ffmpeg.org/wiki/Concatenate
        f = Tempfile.new("inputs")
        m4a_paths.each do |m4a_path|
          f.write("file '#{m4a_path}'\n")
        end
        f.close

        out_path = m4a_paths[0].sub(/.m4a\z/, "-concat.m4a")
        system("ffmpeg -y -f concat -safe 0 -i #{f.path} -c copy #{out_path}", exception: true)
        out_path
      end
    end
  end
end
