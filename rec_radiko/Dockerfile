FROM amazon/aws-lambda-ruby:2.7

ENV TZ=Asia/Tokyo

COPY ./Gemfile ./Gemfile
COPY ./Gemfile.lock ./Gemfile.lock

RUN bundle install

COPY ./ ./

RUN ln -s /var/task/libexec/ffmpeg /usr/local/bin/ffmpeg \
  && ln -s /var/task/libexec/radigo /usr/local/bin/radigo

CMD ["function.handler.handle"]
