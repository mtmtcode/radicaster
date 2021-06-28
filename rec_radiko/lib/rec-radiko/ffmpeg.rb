require "tempfile"

module Radicaster
  module RecRadiko
    class Ffmpeg
      def concat(aac_paths)
        # NOTE:
        # ffmpegでファイルを連結するには元ファイルのリストを書いたテキストを
        # 入力ファイルとして食わせる必要がある
        # https://trac.ffmpeg.org/wiki/Concatenate
        f = Tempfile.new("inputs")
        aac_paths.each do |aac_path|
          f.write("file '#{aac_path}'\n")
        end
        f.close

        # NOTE:
        # Apple Podcast Appでaacをうまく扱えなかったので連結ついでにm4aに変換
        m4a_path = aac_paths[0].sub(/.aac\z/, ".m4a")
        system("ffmpeg -y -f concat -safe 0 -i #{f.path} -c copy #{m4a_path}", exception: true)
        m4a_path
      end
    end
  end
end
