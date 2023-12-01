#!/usr/bin/env bash
#=================================================
#  System Required: CentOS/Debian/ArchLinux with Systemd Support
#  Description: Tianji Report
#  Author: moonrailgun
#=================================================

Green_font_prefix="\033[32m" && Red_font_prefix="\033[31m" && Red_background_prefix="\033[41;37m" && Font_color_suffix="\033[0m"
Info="${Green_font_prefix}[Info]${Font_color_suffix}"
Error="${Red_font_prefix}[Error]${Font_color_suffix}"
Tip="${Green_font_prefix}[Tip]${Font_color_suffix}"

function check_sys() {
  if [[ -f /etc/redhat-release ]]; then
    release="centos"
  elif grep -q -E -i "debian|ubuntu" /etc/issue; then
    release="debian"
  elif grep -q -E -i "centos|red hat|redhat" /etc/issue; then
    release="centos"
  elif grep -q -E -i "Arch|Manjaro" /etc/issue; then
    release="arch"
  elif grep -q -E -i "debian|ubuntu" /proc/version; then
    release="debian"
  elif grep -q -E -i "centos|red hat|redhat" /proc/version; then
    release="centos"
  else
    echo -e "Tianji Report not support this linux version"
    exit 1
  fi
  bit=$(uname -m)
}

function check_pid() {
  PID=$(pgrep -f "tianji-reporter")
}

function install_dependencies() {
  case ${release} in
  centos)
    yum install -y wget curl
    ;;
  debian)
    apt-get update -y
    apt-get install -y wget curl
    ;;
  arch)
    pacman -Syu --noconfirm wget curl
    ;;
  *)
    exit 1
    ;;
  esac
}

function input_dsn() {
  defaultServer="{{DEFAULT_SERVER}}"
  echo -e "${Info} Please input server url, press enter use default value(default: $defaultServer)"
  read -re serverUrl
  serverUrl=${serverUrl:-$defaultServer}

  defaultWorkspace="{{DEFAULT_WORKSPACE}}"
  echo -e "${Info} Please input workspaceId, press enter use default value(default: $defaultWorkspace)"
  read -re workspace
  workspace=${workspace:-$defaultWorkspace}
}

service_conf=/usr/lib/systemd/system/tianji-reporter.service

function write_service() {
  echo -e "${Info} Write to systemd configuration"
  cat >${service_conf} <<-EOF
[Unit]
Description=Tianji-Reporter
Documentation=https://github.com/msgbyte/tianji
After=network.target

[Service]
ExecStart=/usr/local/tianji/reporter/tianji-reporter --url "${serverUrl}" --workspace "${workspace}"
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

}

function enable_service() {
  write_service
  systemctl enable tianji-reporter
  systemctl start tianji-reporter
  check_pid
  if [[ -n ${PID} ]]; then
    echo -e "${Info} Tianji Reporter Started!"
  else
    echo -e "${Error} Tianji Reporter Start Failed!"
  fi
}

function restart_service() {
  write_service
  systemctl daemon-reload
  systemctl restart tianji-reporter
  check_pid
  if [[ -n ${PID} ]]; then
    echo -e "${Info} Tianji Reporter Started!"
  else
    echo -e "${Error} Tianji Reporter Start Failed!"
  fi
}

function reset_config() {
  restart_service
}

function install_client() {
  case ${bit} in
  x86_64)
    arch=amd64
    ;;
  # i386)
  #   arch=386
  #   ;;
  aarch64 | aarch64_be | arm64 | armv8b | armv8l)
    arch=arm64
    ;;
  # arm | armv6l | armv7l | armv5tel | armv5tejl)
  #   arch=arm
  #   ;;
  # mips | mips64)
  #   arch=mips
  #   ;;
  *)
    exit 1
    ;;
  esac
  echo -e "${Info} Downloading ${arch} binary file..."
  mkdir -p /usr/local/tianji/reporter/
  cd /tmp
  # wget --no-check-certificate "https://github.com/msgbyte/tianji/releases/latest/download/tianji-reporter-linux-${arch}"
  wget --no-check-certificate "https://temp-storage.msgbyte.com/tianji-reporter/tianji-reporter-linux-${arch}"
  mv tianji-reporter-linux-${arch} /usr/local/tianji/reporter/tianji-reporter
  chmod +x /usr/local/tianji/reporter/tianji-reporter
  enable_service
}

function auto_install() {
  dsn=$(echo ${*})
  install_client
}

function uninstall_client() {
  systemctl stop tianji-reporter
  systemctl disable tianji-reporter
  rm -rf /usr/local/tianji/reporter/
  rm -rf /usr/lib/systemd/system/tianji-reporter.service
}

check_sys
case "$1" in
uninstall|uni)
  uninstall_client
  ;;
reset_conf|re)
  input_dsn
  reset_config
  ;;
-dsn)
  shift 1
  install_dependencies
  auto_install ${*}
  ;;
*)
  install_dependencies
  input_dsn
  install_client
  ;;
esac
