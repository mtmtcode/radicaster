FROM amazon/aws-lambda-ruby:2.7 AS bundler
WORKDIR /var/task
RUN yum groupinstall -y "Development Tools"
COPY ./Gemfile ./Gemfile
COPY ./Gemfile.lock ./Gemfile.lock
RUN bundle install --path=vendor/bundle


FROM amazon/aws-lambda-ruby:2.7 AS download
WORKDIR /tmp
ADD https://github.com/yyoshiki41/radigo/releases/download/v0.11.0/radigo_v0.11.0_linux_amd64.zip /tmp/radigo.zip
ADD https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz /tmp/ffmpeg.tar.xz
RUN yum install -y unzip tar xz \
  && unzip /tmp/radigo.zip \
  && tar -Jxf /tmp/ffmpeg.tar.xz \
  && cp /tmp/ffmpeg-*/ffmpeg ffmpeg


FROM amazon/aws-lambda-ruby:2.7
WORKDIR /var/task

ENV TZ=Asia/Tokyo

COPY --from=bundler /var/task/vendor ./vendor
COPY --from=download /tmp/radigo /usr/local/bin/radigo
COPY --from=download /tmp/ffmpeg /usr/local/bin/ffmpeg
COPY ./ ./

CMD ["function.Handler.handle"]
