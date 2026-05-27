最新 RTOS 多任务框架设计：从任务、队列、事件到状态机的工程化落地

适用场景：TBOX、IoT 网关、公网对讲机、工业控制器、车载终端、MCU + 通信模组、MCU + MPU 协同系统。  
核心目标：设计一个可维护、可调试、可扩展、可低功耗、可异常恢复的 RTOS 多任务框架。

---

1. 结论

一个优秀的 RTOS 多任务框架，不是简单地“功能来一个，任务开一个”，而应该围绕以下几个核心原则设计：

任务负责并发边界，队列负责跨任务传递数据，事件负责状态通知，状态机负责复杂业务流转，资源 owner 负责共享资源一致性。

推荐的整体架构是：

    一个事件入口
    一个命令执行器
    一个状态 owner
    一个上报出口
    一个低功耗仲裁器
    一个日志出口
    一个系统监控中心

最终形成：

    输入源 → 服务任务 → 事件/命令队列 → 业务状态机 → 统一上报/低功耗/日志/监控

---

2. 为什么 RTOS 项目需要框架化设计？

很多 RTOS 项目一开始看起来很简单：

    串口收数据
    云端收命令
    蓝牙收命令
    解析协议
    控制外设
    上报云端
    写日志
    进入低功耗

初期常见写法是：

    一个功能一个任务
    一个模块一个全局变量
    一个回调里直接处理业务
    一个状态用多个 flag 拼起来

短期能跑，但项目一复杂，就会出现：

    1. 任务越来越多，不知道谁负责什么
    2. 全局变量到处修改，状态来源失控
    3. 队列满了不知道丢了什么
    4. 命令收到后到底有没有执行成功说不清
    5. ACK 成功、上报成功、云端确认混在一起
    6. 低功耗判断混乱，系统唤醒和外设唤醒分不清
    7. 日志只有 success/fail，无法定位失败层级
    8. 后续新增功能只能继续打补丁

所以，多任务框架的本质不是“把任务分多”，而是建立一套长期可维护的系统规则。

---

3. 总体设计目标

  目标  	说明                              
  可维护 	模块边界清晰，新增业务不破坏已有逻辑              
  可调试 	每条命令、事件、状态都能追踪                  
  可扩展 	新增 BLE、RS485、云端、FTP、OTA 不需要重构主框架
  可恢复 	网络断开、ACK 超时、文件失败、队列满都有处理路径      
  可低功耗	所有 sleep / wakeup 走统一仲裁         
  可测试 	每个任务、队列、状态机都有验证点                
  可裁剪 	小项目保留核心任务，大项目按需扩展               

---

4. 总体架构

4.1 分层架构

    ┌────────────────────────────────────────────────────────────┐
    │                    Application Layer                       │
    │                                                            │
    │  cmd_app      vehicle_app      report_app      lpm_app     │
    │  ota_app      ftp_app          factory_app     diag_app    │
    └──────────────────────────────▲─────────────────────────────┘
                                   │
    ┌──────────────────────────────┴─────────────────────────────┐
    │                      Service Layer                         │
    │                                                            │
    │  rs485_svc    cloud_svc    ble_svc    storage_svc          │
    │  log_svc      net_svc      time_svc   gnss_svc             │
    └──────────────────────────────▲─────────────────────────────┘
                                   │
    ┌──────────────────────────────┴─────────────────────────────┐
    │                    Framework Layer                         │
    │                                                            │
    │  event_bus    cmd_engine    msg_queue    buffer_pool        │
    │  timer_mgr    trace_mgr     monitor      error_model        │
    └──────────────────────────────▲─────────────────────────────┘
                                   │
    ┌──────────────────────────────┴─────────────────────────────┐
    │                     Driver Layer                           │
    │                                                            │
    │  uart    gpio    rs485    spi_nand    rtc    wdg           │
    └──────────────────────────────▲─────────────────────────────┘
                                   │
    ┌──────────────────────────────┴─────────────────────────────┐
    │                       RTOS / BSP                           │
    │                                                            │
    │              ThreadX / FreeRTOS / RT-Thread / Vendor OS    │
    └────────────────────────────────────────────────────────────┘

---

5. 核心设计原则

5.1 任务不是功能，任务是并发边界

错误理解：

    一个功能 = 一个任务
    一个命令 = 一个任务
    一个状态 = 一个任务

正确理解：

    任务用于隔离阻塞、实时性、资源所有权和复杂状态机。

适合独立任务的场景：

  条件    	示例                      
  会长期阻塞 	网络连接、FTP 上传、OTA 下载      
  有独立实时性	RS485 接收、CAN 接收         
  有独占资源 	UART TX、日志文件、MQTT client
  有复杂状态机	OTA、LPM、命令执行            
  失败恢复复杂	云端重连、文件上传、升级流程          

---

5.2 队列不是全局垃圾桶

队列适合：

    传命令
    传事件
    传数据包
    传异步请求
    传执行结果

队列不适合：

    保存长期状态
    传局部变量地址
    无 owner 的指针
    大量无意义重复事件

---

5.3 事件不等于执行成功

必须区分：

    收到命令 ≠ 执行成功
    解析成功 ≠ 本地执行成功
    本地写值成功 ≠ 外设执行成功
    RS485 发送成功 ≠ 仪表 ACK 成功
    ACK 成功 ≠ 事件/属性上报成功
    上报成功 ≠ 云端最终确认成功

---

5.4 每个关键资源必须有唯一 owner

  资源/状态        	owner                     	访问方式                    
  vehicle_state	vehicle_app / vehicle_task	getter / event / request
  RS485 TX     	rs485_tx_task             	rs485_tx_queue          
  MQTT client  	cloud_task                	cloud API / queue       
  BLE 状态       	ble_task                  	ble API / event         
  日志文件         	log_task                  	log_queue               
  配置文件         	cfg_svc                   	cfg API                 
  OTA 文件       	ota_task                  	ota API                 
  FTP client   	ftp_task                  	ftp_queue               
  LPM 状态       	lpm_task                  	lpm_request API         

禁止多个任务随意修改同一个全局状态。

---

6. 推荐任务模型

6.1 第一阶段：最小可落地任务

第一版不要任务过多，建议保留这些核心任务：

  任务             	职责             
  boot_task      	系统初始化、创建任务     
  app_router_task	系统事件路由，只转发不做重业务
  rs485_task     	RS485 接收、解析、发送 
  cloud_task     	云端连接、云端命令入口    
  cmd_exec_task  	命令事务执行         
  report_task    	统一事件/属性上报      
  lpm_task       	低功耗统一仲裁        
  log_task       	异步日志写入         
  monitor_task   	任务健康、队列水位、栈水位监控

---

6.2 第二阶段：按复杂度拆分

当业务复杂后，再拆成：

  任务                           	何时拆                      
  rs485_rx_task / rs485_tx_task	RS485 收发压力大、发送阻塞明显       
  vehicle_task                 	车辆状态来源复杂，需要统一聚合          
  ota_task                     	OTA 流程复杂，需要独立状态机         
  ftp_task                     	FTP 上传耗时，不能影响核心业务        
  factory_task                 	出厂/EOL 流程复杂              
  diag_task                    	诊断协议复杂                   
  shell_task                   	调试 shell / RS485 shell 复杂

---

7. 推荐任务拓扑

                             ┌──────────────┐
                             │  boot_task   │
                             └──────┬───────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │ init system  │
                             └──────┬───────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │  rs485_task  │        │  cloud_task  │        │   ble_task   │
    └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
           │                       │                       │
           └──────────────┬────────┴──────────────┬────────┘
                          ▼                       ▼
                  ┌──────────────┐        ┌──────────────┐
                  │ event_queue  │        │  cmd_queue   │
                  └──────┬───────┘        └──────┬───────┘
                         │                       │
                         ▼                       ▼
                  ┌──────────────┐        ┌──────────────┐
                  │app_router_task│        │cmd_exec_task │
                  └──────┬───────┘        └──────┬───────┘
                         │                       │
            ┌────────────┼────────────┐          │
            ▼            ▼            ▼          ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │report_task │ │ lpm_task   │ │ log_task   │ │ rs485_send │
    └────────────┘ └────────────┘ └────────────┘ └────────────┘
    
    后台：
    ┌──────────────┐
    │ monitor_task │
    └──────────────┘

---

8. 消息模型设计

8.1 三类消息通道

    event_queue     ：系统事件，表示“发生了什么”
    cmd_queue       ：业务命令，表示“要执行什么”
    data_queue      ：数据通道，表示“传递什么数据”

---

8.2 推荐队列

  队列            	作用      
  event_queue   	系统事件入口  
  cmd_queue     	命令事务执行  
  report_queue  	上报请求    
  rs485_tx_queue	RS485 发送
  log_queue     	日志写入    
  lpm_queue     	低功耗请求   
  ota_queue     	OTA 请求  
  ftp_queue     	FTP 上传请求

---

8.3 队列容量建议

  队列            	    建议深度	满队列策略              
  event_queue   	 32 ~ 64	关键事件保留，非关键事件可丢     
  cmd_queue     	  8 ~ 16	忙则拒绝新命令            
  report_queue  	32 ~ 128	进入离线缓存             
  rs485_tx_queue	 16 ~ 32	关键帧不丢，普通帧可丢        
  log_queue     	64 ~ 256	debug 可丢，error 尽量保留
  lpm_queue     	 16 ~ 32	不建议丢，重复事件可合并       
  ota_queue     	   1 ~ 2	OTA 忙则拒绝           
  ftp_queue     	   1 ~ 4	FTP 忙则拒绝           

---

9. 核心结构体设计

9.1 系统事件结构

    typedef enum
    {
        APP_EVT_NONE = 0,
    
        APP_EVT_BOOT_DONE,
        APP_EVT_NET_READY,
        APP_EVT_NET_LOST,
    
        APP_EVT_RS485_FRAME_READY,
        APP_EVT_RS485_ACK_TIMEOUT,
    
        APP_EVT_CLOUD_CMD_READY,
        APP_EVT_BLE_CMD_READY,
    
        APP_EVT_VEH_LOCKED,
        APP_EVT_VEH_UNLOCKED,
        APP_EVT_VEH_STATE_CHANGED,
    
        APP_EVT_LPM_SLEEP_REQ,
        APP_EVT_LPM_WAKEUP_REQ,
    
        APP_EVT_OTA_DONE,
        APP_EVT_OTA_FAIL,
    
        APP_EVT_ERROR,
    } app_evt_id_t;
    
    typedef enum
    {
        APP_SRC_NONE = 0,
        APP_SRC_RS485,
        APP_SRC_CLOUD,
        APP_SRC_BLE,
        APP_SRC_LPM,
        APP_SRC_OTA,
        APP_SRC_FTP,
        APP_SRC_TIMER,
    } app_src_t;
    
    typedef struct
    {
        app_evt_id_t id;
        app_src_t src;
    
        uint16_t len;
        uint32_t tick;
        uint32_t trace_id;
    
        void *data;
    } app_event_t;

---

9.2 命令上下文结构

    typedef enum
    {
        CMD_SRC_CLOUD = 0,
        CMD_SRC_BLE,
        CMD_SRC_NFC,
        CMD_SRC_RS485,
        CMD_SRC_LOCAL,
        CMD_SRC_FACTORY,
    } cmd_src_t;
    
    typedef enum
    {
        CMD_ACK_NONE = 0,
        CMD_ACK_LOCAL_ONLY,
        CMD_ACK_WAIT_RS485,
        CMD_ACK_WAIT_CLOUD,
        CMD_ACK_WAIT_BOTH,
    } cmd_ack_policy_t;
    
    typedef enum
    {
        CMD_RESULT_NONE = 0,
        CMD_RESULT_OK,
        CMD_RESULT_BUSY,
        CMD_RESULT_PARAM_ERR,
        CMD_RESULT_TIMEOUT,
        CMD_RESULT_EXEC_FAIL,
        CMD_RESULT_ACK_FAIL,
        CMD_RESULT_REPORT_FAIL,
    } cmd_result_t;
    
    typedef struct
    {
        uint32_t trace_id;
        uint32_t cmd_id;
        cmd_src_t src;
    
        cmd_ack_policy_t ack_policy;
    
        uint32_t start_tick;
        uint32_t timeout_ms;
    
        uint8_t retry_count;
        uint8_t retry_max;
    
        void *param;
        uint16_t param_len;
    
        cmd_result_t result;
    } cmd_context_t;

---

10. app_router_task 设计

10.1 职责

app_router_task 只做三件事：

    1. 接收系统事件
    2. 根据事件类型转发到目标任务
    3. 记录 trace/log

10.2 禁止做的事

    不解析复杂协议
    不执行命令
    不等待 ACK
    不写配置
    不直接改 vehicle_state
    不直接调用 sleep/wakeup
    不直接 publish 云端事件

10.3 示例

    static void app_router_dispatch(const app_event_t *evt)
    {
        switch (evt->id)
        {
            case APP_EVT_CLOUD_CMD_READY:
                cmd_exec_post((cmd_context_t *)evt->data);
                break;
    
            case APP_EVT_RS485_FRAME_READY:
                rs485_proto_post(evt->data, evt->len);
                break;
    
            case APP_EVT_VEH_STATE_CHANGED:
                vehicle_post_event(evt->data, evt->len);
                break;
    
            case APP_EVT_LPM_SLEEP_REQ:
            case APP_EVT_LPM_WAKEUP_REQ:
                lpm_post_event(evt);
                break;
    
            default:
                break;
        }
    }

---

11. 命令执行状态机

11.1 状态定义

    typedef enum
    {
        CMD_ST_IDLE = 0,
        CMD_ST_DEQUEUE,
        CMD_ST_VALIDATE,
        CMD_ST_LOCAL_PREPARE,
        CMD_ST_SEND_TO_DEVICE,
        CMD_ST_WAIT_ACK,
        CMD_ST_APPLY_STATE,
        CMD_ST_REPORT_RESULT,
        CMD_ST_DONE,
        CMD_ST_FAIL,
        CMD_ST_ROLLBACK,
    } cmd_exec_state_t;

---

11.2 命令执行链路

    收到命令
      ↓
    参数校验
      ↓
    权限/状态检查
      ↓
    本地准备
      ↓
    下发到 RS485 / BLE / 本地模块
      ↓
    等待 ACK
      ↓
    更新业务状态
      ↓
    触发上报
      ↓
    记录结果

---

11.3 ACK 等待建议

不建议在 cmd_exec_task 中长时间阻塞：

    send_rs485_cmd();
    wait_ack_forever();

推荐方式：

    cmd_exec_task 发送命令
      ↓
    设置 pending_cmd
      ↓
    启动 timeout timer
      ↓
    任务继续等待队列
      ↓
    RS485 ACK 到达后投递 ACK 事件
      ↓
    cmd_exec_task 根据 trace_id / cmd_id 匹配 ACK

优点：

    1. cmd_exec_task 不会卡死
    2. 可以同时处理其他事件
    3. 方便超时和重试
    4. 方便记录状态流转

---

12. RS485 服务设计

12.1 接收链路

    UART ISR / DMA IDLE
      ↓
    释放信号量 / 设置事件
      ↓
    rs485_task
      ↓
    从 ring buffer 取数据
      ↓
    流式解析
      ↓
    帧校验
      ↓
    生成 RS485 协议事件
      ↓
    投递到 event_queue / cmd_exec_task / vehicle_app

12.2 ISR 中不要做

    不解析复杂协议
    不 malloc
    不写文件
    不上报云端
    不跑业务状态机
    不长时间 printf

---

13. 上报任务设计

13.1 上报状态机

    REPORT_ST_IDLE
      ↓
    REPORT_ST_BUILD
      ↓
    REPORT_ST_WAIT_NET
      ↓
    REPORT_ST_PUBLISH
      ↓
    REPORT_ST_WAIT_CONFIRM
      ↓
    REPORT_ST_DONE

失败路径：

    网络未就绪 → 离线缓存
    publish 失败 → 离线缓存或重试
    云端未确认 → 根据策略重试
    缓存失败 → 记录错误

---

13.2 上报分层

必须区分：

    生成事件成功
    进入 report_queue 成功
    MQTT publish 调用成功
    SDK 返回成功
    云端确认成功
    离线缓存成功
    补发成功

---

14. 低功耗任务设计

14.1 原则

低功耗不能由业务模块直接调用系统 sleep/wakeup。

禁止：

    if (lock) {
        bst_sleep();
    }

推荐：

    lpm_request_sleep(LPM_SRC_VEH_LOCK);
    lpm_request_wakeup(LPM_SRC_CLOUD_CMD);

只有 lpm_task 可以真正调用系统休眠/唤醒接口。

---

14.2 LPM 状态机

    typedef enum
    {
        LPM_ST_ACTIVE = 0,
        LPM_ST_IDLE_CHECK,
        LPM_ST_SLEEP_PENDING,
        LPM_ST_PREPARE_SLEEP,
        LPM_ST_SLEEPING,
        LPM_ST_WAKEUP_PENDING,
        LPM_ST_RECOVERING,
        LPM_ST_ERROR,
    } lpm_state_t;

---

14.3 LPM lock bit

    typedef enum
    {
        LPM_LOCK_NONE     = 0,
        LPM_LOCK_BLE      = 1 << 0,
        LPM_LOCK_CLOUD    = 1 << 1,
        LPM_LOCK_RS485    = 1 << 2,
        LPM_LOCK_REPORT   = 1 << 3,
        LPM_LOCK_OTA      = 1 << 4,
        LPM_LOCK_FTP      = 1 << 5,
        LPM_LOCK_FACTORY  = 1 << 6,
        LPM_LOCK_DIAG     = 1 << 7,
    } lpm_lock_bits_t;

---

14.4 是否允许休眠

不能只看 lock_bits，还要看：

    关键队列是否为空
    是否存在 ACK_WAIT
    是否存在 report_pending
    是否存在 file_write_pending
    是否处于 OTA / FTP
    是否处于 factory / diag
    网络是否正在关键事务
    RS485 是否正在发送

示例：

    static int lpm_can_sleep(lpm_reason_t *block_reason)
    {
        if (g_lpm.lock_bits != 0) {
            *block_reason = LPM_BLOCK_LOCK_BITS;
            return 0;
        }
    
        if (!cmd_exec_is_idle()) {
            *block_reason = LPM_BLOCK_CMD_BUSY;
            return 0;
        }
    
        if (!report_is_idle()) {
            *block_reason = LPM_BLOCK_REPORT_PENDING;
            return 0;
        }
    
        if (!rs485_is_idle()) {
            *block_reason = LPM_BLOCK_RS485_BUSY;
            return 0;
        }
    
        if (!storage_is_idle()) {
            *block_reason = LPM_BLOCK_STORAGE_BUSY;
            return 0;
        }
    
        return 1;
    }

---

14.5 低功耗链路分层

涉及低功耗、唤醒、命令执行、ACK 和上报时，必须区分：

    系统休眠/唤醒状态
      ↓
    外设/仪表/模块唤醒动作
      ↓
    总线使能状态
      ↓
    命令接收链路
      ↓
    命令解析链路
      ↓
    本地执行链路
      ↓
    ACK/反馈确认链路
      ↓
    事件上报链路
      ↓
    属性回云链路
      ↓
    云端确认链路

不要把 GPIO 电平变化、WAKEUP_OUT、外设唤醒动作直接等价为系统已经退出低功耗。

---

15. 日志和可观测性设计

15.1 trace_id 贯穿全链路

一条云端开锁命令，建议日志能看到：

    [trace=1001][CLOUD] recv cmd=0x21000004 msgId=xxx
    [trace=1001][CMD] state=VALIDATE ret=0
    [trace=1001][CMD] state=SEND_RS485 ret=0
    [trace=1001][CMD] state=WAIT_ACK ret=0 cost=120ms
    [trace=1001][VEH] lock_state=UNLOCKED src=CLOUD
    [trace=1001][REPORT] event=102 enqueue ret=0
    [trace=1001][MQTT] publish ret=0

这样出现问题时，可以判断失败停在哪一层。

---

15.2 队列统计

    typedef struct
    {
        uint32_t send_cnt;
        uint32_t recv_cnt;
        uint32_t full_cnt;
        uint32_t drop_cnt;
        uint32_t high_water;
    } queue_stat_t;

每个关键队列都建议有统计：

    event_queue
    cmd_queue
    report_queue
    rs485_tx_queue
    log_queue
    lpm_queue

---

15.3 任务统计

    typedef struct
    {
        uint32_t last_alive_tick;
        uint32_t loop_cnt;
        uint32_t err_cnt;
        uint32_t max_cost_ms;
        uint32_t stack_min_free;
    } task_stat_t;

monitor_task 周期性检查：

    任务是否还活着
    任务栈是否够用
    队列是否接近满
    状态机是否卡住
    最近一次错误是什么
    最近一次活动时间是什么

---

16. 日志任务设计

16.1 原则

    高优先级任务不能等待日志落盘
    debug 日志可以丢
    error 日志尽量保留
    文件写失败不能影响核心业务
    日志队列满必须计数

16.2 日志分级

  级别   	满队列策略
  ERROR	尽量保留 
  WARN 	尽量保留 
  INFO 	可丢   
  DEBUG	优先丢  

---

17. 存储访问设计

如果多个任务都直接访问文件系统，容易出现：

    文件系统重入问题
    打开文件过多
    写入阻塞
    断电一致性差
    路径冲突
    空间不足处理分散

推荐规则：

  文件类型  	owner      	说明              
  日志文件  	log_task   	只允许 log_task 写  
  配置文件  	cfg_svc    	提供同步 API 或队列 API
  OTA 文件	ota_task   	OTA 流程独占        
  离线事件  	report_task	report_task 统一管理
  FTP 读取	ftp_task   	只读日志，不直接改日志文件   

---

18. 推荐目录结构

    project/
    ├── app/
    │   ├── app_router.c
    │   ├── app_router.h
    │   ├── cmd_app.c
    │   ├── cmd_app.h
    │   ├── vehicle_app.c
    │   ├── vehicle_app.h
    │   ├── report_app.c
    │   ├── report_app.h
    │   ├── lpm_app.c
    │   └── lpm_app.h
    │
    ├── services/
    │   ├── rs485_svc.c
    │   ├── rs485_svc.h
    │   ├── cloud_svc.c
    │   ├── cloud_svc.h
    │   ├── ble_svc.c
    │   ├── ble_svc.h
    │   ├── storage_svc.c
    │   ├── storage_svc.h
    │   ├── log_svc.c
    │   └── log_svc.h
    │
    ├── framework/
    │   ├── fw_event.c
    │   ├── fw_event.h
    │   ├── fw_cmd.c
    │   ├── fw_cmd.h
    │   ├── fw_queue.c
    │   ├── fw_queue.h
    │   ├── fw_timer.c
    │   ├── fw_timer.h
    │   ├── fw_mem_pool.c
    │   ├── fw_mem_pool.h
    │   ├── fw_trace.c
    │   ├── fw_trace.h
    │   ├── fw_monitor.c
    │   └── fw_monitor.h
    │
    ├── drivers/
    │   ├── drv_uart.c
    │   ├── drv_gpio.c
    │   ├── drv_rs485.c
    │   ├── drv_spi_nand.c
    │   └── drv_wdg.c
    │
    ├── config/
    │   ├── task_config.h
    │   ├── queue_config.h
    │   ├── feature_config.h
    │   └── app_config.h
    │
    └── main/
        ├── main.c
        ├── boot_mgr.c
        └── boot_mgr.h

---

19. 启动流程设计

    main()
      ↓
    RTOS kernel start
      ↓
    boot_task
      ↓
    board_init
      ↓
    driver_init
      ↓
    storage_init
      ↓
    framework_init
      ↓
    queue_create
      ↓
    mem_pool_create
      ↓
    service_init
      ↓
    app_init
      ↓
    task_create
      ↓
    APP_EVT_BOOT_DONE

示例：

    void boot_task_entry(ULONG arg)
    {
        board_init();
    
        drv_uart_init();
        drv_gpio_init();
        drv_rs485_init();
    
        storage_svc_init();
        cfg_svc_init();
    
        fw_event_init();
        fw_cmd_init();
        fw_mem_pool_init();
        fw_trace_init();
        fw_monitor_init();
    
        rs485_svc_init();
        cloud_svc_init();
        ble_svc_init();
        log_svc_init();
    
        vehicle_app_init();
        cmd_app_init();
        report_app_init();
        lpm_app_init();
    
        app_tasks_create();
    
        app_event_post_simple(APP_EVT_BOOT_DONE, APP_SRC_NONE);
    }

---

20. 优先级设计建议

  分组   	任务                                      	说明       
  高优先级 	rs485_rx_task / monitor_task            	实时输入、系统健康
  中高优先级	app_router_task / cmd_exec_task / lpm_task	核心控制链路   
  中优先级 	cloud_task / ble_task / vehicle_task    	通信和业务状态  
  中低优先级	report_task / rs485_tx_task             	输出和上报    
  低优先级 	log_task / ftp_task / ota_task          	后台耗时任务   

原则：

    高优先级任务不能写文件
    高优先级任务不能等待网络
    高优先级任务不能做大 JSON 解析
    高优先级任务不能长时间持锁
    低优先级任务必须可被打断
    所有任务等待都要有超时

---

21. 最小落地路线

21.1 V1.0：先跑通核心闭环

实现：

    app_event_t
    cmd_context_t
    app_router_task
    cmd_exec_task
    report_task
    lpm_task
    log_task
    monitor_task
    trace_id
    queue_stat

目标：

    输入源能进事件队列
    命令能进入 cmd_exec_task
    上报统一走 report_task
    低功耗统一走 lpm_task
    日志统一走 log_task
    队列满有统计
    任务状态可监控

---

21.2 V1.5：收敛所有权

目标：

    消灭多个任务直接修改全局状态

重点：

    vehicle_state 归 vehicle_app / vehicle_task
    rs485_tx 归 rs485_tx_task
    report 归 report_task
    lpm_state 归 lpm_task
    log file 归 log_task

---

21.3 V2.0：事务化和可观测

目标：

    命令可追踪
    失败可定位
    异常可恢复

重点：

    cmd_context_t
    trace_id
    cmd_state_machine
    report_state_machine
    lpm_state_machine
    queue_stat
    task_stat
    offline_report_cache

---

21.4 V3.0：组件化和产品化

目标：

    适配多个项目

重点：

    feature_config
    模块裁剪
    平台适配层
    统一接口
    单元测试
    故障注入测试

---

22. 架构验收标准

22.1 功能验收

  验收项     	通过标准                       
  云端命令    	能完整追踪接收、解析、执行、ACK、上报       
  RS485 接收	高负载下不丢关键帧                  
  上报      	网络断开后可缓存，恢复后补发             
  OTA     	下载、校验、写入、重启、上报分层明确         
  FTP     	上传失败可重试，不阻塞核心业务            
  日志      	不影响高优先级任务                  
  LPM     	所有 sleep/wakeup 经过 lpm_task
  队列满     	有日志、有计数、有降级策略              

---

22.2 调试验收

系统必须能回答：

    这个事件是谁发的？
    哪个任务处理了？
    当前状态是什么？
    失败停在哪一层？
    队列有没有满？
    任务有没有卡死？
    栈有没有不够？
    是否进入低功耗？
    是系统醒了，还是外设醒了？
    命令是收到成功，还是执行成功？
    ACK 成功后有没有上报？
    上报后云端有没有确认？

---

23. 架构风险与取舍

23.1 风险一：过度架构

不要第一版就实现：

    复杂事件订阅系统
    动态模块注册
    复杂插件框架
    完整 buffer 引用计数
    完整诊断框架

建议：

    先做最小闭环，再按压力点扩展。

---

23.2 风险二：owner 规则没有落地

如果代码里仍然大量存在：

    extern vehicle_state_t g_vehicle_state;
    extern uint8_t g_lpm_state;
    extern int rs485_send_directly(...);

那么架构会很快失效。

建议：

    全局状态尽量 static
    只暴露 getter / post_event / request API
    禁止跨模块直接写状态

---

23.3 风险三：任务优先级不合理

高优先级任务做了文件写入、网络等待、大 JSON 解析，会导致实时性问题。

建议：

    高优先级任务只做短路径处理
    耗时操作全部转给低优先级 worker
    所有阻塞都必须有 timeout

---

23.4 风险四：低功耗误判

低功耗不能只看：

    lock_state
    BLE connected
    WAKEUP_OUT
    KL15

还要看：

    系统是否真的醒
    外设是否醒
    总线是否可用
    是否有命令待执行
    是否有 ACK 待确认
    是否有上报待完成
    是否有文件写入待完成

---

24. 最终推荐版本

24.1 核心任务

    1. boot_task
    2. app_router_task
    3. rs485_task
    4. cloud_task
    5. cmd_exec_task
    6. report_task
    7. lpm_task
    8. log_task
    9. monitor_task

24.2 按需扩展任务

    10. ble_task
    11. vehicle_task
    12. ota_task
    13. ftp_task
    14. factory_task
    15. diag_task
    16. shell_task

24.3 核心机制

    event_queue
    cmd_queue
    report_queue
    rs485_tx_queue
    log_queue
    lpm_queue
    
    trace_id
    cmd_context_t
    cmd_state_machine
    report_state_machine
    lpm_state_machine
    queue_stat
    task_stat
    owner 规则

---

25. 一句话总结

一个优秀的 RTOS 多任务框架，最关键的不是任务数量，而是系统边界：

减任务、强 owner、加 trace、分层成功、统一仲裁、持续监控。

做到这几点，系统才不会随着业务增长变成一堆任务、flag、全局变量和不可追踪的回调，而是可以持续演进、持续定位、持续维护。
