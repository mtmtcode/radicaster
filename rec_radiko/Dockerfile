FROM amazon/aws-lambda-ruby:2.7 AS bundler
WORKDIR /var/task
RUN yum groupinstall -y "Development Tools"
COPY ./Gemfile ./Gemfile
COPY ./Gemfile.lock ./Gemfile.lock
RUN bundle install --path=vendor/bundle


FROM amazon/aws-lambda-ruby:2.7 AS download
WORKDIR /tmp
ADD https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz /tmp/ffmpeg.tar.xz
RUN yum install -y tar xz \
  && tar -Jxf /tmp/ffmpeg.tar.xz \
  && cp /tmp/ffmpeg-*/ffmpeg ffmpeg \
  && cp /tmp/ffmpeg-*/ffprobe ffprobe



FROM amazon/aws-lambda-ruby:2.7
WORKDIR /var/task

ENV TZ=Asia/Tokyo

RUN yum install -y libxml2 coreutils which
COPY --from=bundler /var/task/vendor ./vendor
COPY --from=download /tmp/ffmpeg /usr/local/bin/ffmpeg
COPY --from=download /tmp/ffprobe /usr/local/bin/ffprobe
COPY ./rec_radiko_ts.sh /usr/local/bin/rec_radiko_ts.sh
RUN chmod 755 /usr/local/bin/rec_radiko_ts.sh
COPY ./ ./

CMD ["function.Handler.handle"]
